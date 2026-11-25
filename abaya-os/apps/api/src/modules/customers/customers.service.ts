import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { customerQuerySchema, customerSchema, measurementSchema } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/audit.service';
import { EventsService } from '../../common/events.service';
import { conflict, notFound } from '../../common/errors';
import { paged } from '../../common/zod';
import type { AuthUser } from '../../common/auth';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly events: EventsService) {}

  async list(u: AuthUser, q: z.infer<typeof customerQuerySchema>) {
    const where: Prisma.CustomerWhereInput = {
      tenantId: u.tenantId,
      ...(q.tag ? { tags: { has: q.tag } } : {}),
      ...(q.q ? { OR: [
        { fullName: { contains: q.q, mode: 'insensitive' } },
        { phone: { contains: q.q } },
        { email: { contains: q.q, mode: 'insensitive' } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      this.prisma.customer.count({ where }),
    ]);
    return paged(items, total, q.page, q.pageSize);
  }

  async get(u: AuthUser, id: string) {
    const c = await this.prisma.customer.findFirst({
      where: { id, tenantId: u.tenantId },
      include: {
        measurements: { orderBy: { updatedAt: 'desc' } },
        timeline: { orderBy: { createdAt: 'desc' }, take: 50 },
        orders: { orderBy: { placedAt: 'desc' }, take: 20, select: { id: true, number: true, status: true, paymentStatus: true, total: true, placedAt: true } },
      },
    });
    if (!c) throw notFound('customer');
    const returns = await this.prisma.returnRequest.count({ where: { tenantId: u.tenantId, order: { customerId: id } } });
    return { ...c, returnsCount: returns, averageOrderValue: c.ordersCount ? Math.round(c.totalSpent / c.ordersCount) : 0 };
  }

  async create(u: AuthUser, b: z.infer<typeof customerSchema>) {
    await this.assertUnique(u.tenantId, b.phone, b.email);
    const c = await this.prisma.customer.create({ data: { ...b, tenantId: u.tenantId } });
    await this.audit.log(u, 'customer.created', 'Customer', c.id);
    await this.events.publish(u.tenantId, 'customer.created', { id: c.id });
    return c;
  }

  async update(u: AuthUser, id: string, b: z.infer<typeof customerSchema>) {
    await this.own(u, id);
    await this.assertUnique(u.tenantId, b.phone, b.email, id);
    return this.prisma.customer.update({ where: { id }, data: b });
  }

  async remove(u: AuthUser, id: string) {
    await this.own(u, id);
    const orders = await this.prisma.order.count({ where: { customerId: id } });
    if (orders) throw conflict('CUSTOMER_HAS_ORDERS', 'Customer has orders and cannot be deleted');
    await this.prisma.customer.delete({ where: { id } });
    await this.audit.log(u, 'customer.deleted', 'Customer', id);
    return { ok: true };
  }

  async addNote(u: AuthUser, id: string, body: string) {
    await this.own(u, id);
    return this.prisma.customerNote.create({ data: { tenantId: u.tenantId, customerId: id, authorId: u.userId, body } });
  }

  async upsertMeasurement(u: AuthUser, customerId: string, b: z.infer<typeof measurementSchema>, measurementId?: string) {
    await this.own(u, customerId);
    if (measurementId) {
      const m = await this.prisma.customerMeasurement.findFirst({ where: { id: measurementId, customerId, tenantId: u.tenantId } });
      if (!m) throw notFound('measurement');
      return this.prisma.customerMeasurement.update({ where: { id: m.id }, data: b });
    }
    return this.prisma.customerMeasurement.create({ data: { ...b, customerId, tenantId: u.tenantId } });
  }

  async deleteMeasurement(u: AuthUser, customerId: string, measurementId: string) {
    const r = await this.prisma.customerMeasurement.deleteMany({ where: { id: measurementId, customerId, tenantId: u.tenantId } });
    if (!r.count) throw notFound('measurement');
    return { ok: true };
  }

  async tags(u: AuthUser) {
    const rows = await this.prisma.$queryRaw<{ tag: string; count: bigint }[]>`
      SELECT unnest(tags) AS tag, COUNT(*) AS count FROM "Customer" WHERE "tenantId" = ${u.tenantId} GROUP BY tag ORDER BY count DESC LIMIT 100`;
    return rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));
  }

  private async own(u: AuthUser, id: string) {
    const c = await this.prisma.customer.findFirst({ where: { id, tenantId: u.tenantId }, select: { id: true } });
    if (!c) throw notFound('customer');
  }

  private async assertUnique(tenantId: string, phone?: string | null, email?: string | null, exceptId?: string) {
    const or: Prisma.CustomerWhereInput[] = [];
    if (phone) or.push({ phone });
    if (email) or.push({ email });
    if (!or.length) return;
    const dup = await this.prisma.customer.findFirst({ where: { tenantId, OR: or, ...(exceptId ? { id: { not: exceptId } } : {}) } });
    if (dup) throw conflict(dup.phone === phone ? 'PHONE_TAKEN' : 'EMAIL_TAKEN', 'A customer with this contact already exists');
  }
}
