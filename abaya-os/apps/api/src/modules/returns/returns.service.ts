import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { RETURN_TRANSITIONS, createReturnSchema, paginationSchema, returnTransitionSchema, RETURN_STATUSES } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/audit.service';
import { EventsService } from '../../common/events.service';
import { RedisService } from '../../common/redis.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrdersService } from '../orders/orders.service';
import { AppError, badRequest, notFound } from '../../common/errors';
import { paged } from '../../common/zod';
import type { AuthUser } from '../../common/auth';

export const returnQuerySchema = paginationSchema.extend({ status: z.enum(RETURN_STATUSES).optional() });

const detail = {
  order: { select: { id: true, number: true, customerId: true, total: true, amountPaid: true, amountRefunded: true, locationId: true, channel: true, customer: { select: { id: true, fullName: true, phone: true } } } },
  items: { include: { orderItem: true } },
} satisfies Prisma.ReturnRequestInclude;

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly inventory: InventoryService,
    private readonly orders: OrdersService,
    private readonly redis: RedisService,
  ) {}

  async list(u: AuthUser, q: z.infer<typeof returnQuerySchema>) {
    const where: Prisma.ReturnRequestWhereInput = {
      tenantId: u.tenantId,
      ...(q.status ? { status: q.status } : {}),
      ...(q.q ? { OR: [{ number: { contains: q.q, mode: 'insensitive' } }, { order: { number: { contains: q.q } } }] } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.returnRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, include: detail }),
      this.prisma.returnRequest.count({ where }),
    ]);
    return paged(items, total, q.page, q.pageSize);
  }

  async get(u: AuthUser, id: string) {
    const r = await this.prisma.returnRequest.findFirst({ where: { id, tenantId: u.tenantId }, include: detail });
    if (!r) throw notFound('return');
    const exchangeIds = r.items.map((i) => i.exchangeVariantId).filter(Boolean) as string[];
    const exchangeVariants = exchangeIds.length
      ? await this.prisma.productVariant.findMany({ where: { id: { in: exchangeIds }, tenantId: u.tenantId }, select: { id: true, sku: true, size: true, color: true, length: true, price: true } })
      : [];
    return { ...r, exchangeVariants, suggestedRefund: this.suggestedRefund(r) };
  }

  private suggestedRefund(r: { items: { quantity: number; orderItem: { total: number; quantity: number } }[] }) {
    return r.items.reduce((s, i) => s + Math.round((i.orderItem.total / i.orderItem.quantity) * i.quantity), 0);
  }

  async create(u: AuthUser, b: z.infer<typeof createReturnSchema>) {
    const order = await this.prisma.order.findFirst({ where: { id: b.orderId, tenantId: u.tenantId }, include: { items: true } });
    if (!order) throw notFound('order');
    if (!['SHIPPED', 'DELIVERED'].includes(order.status)) throw new AppError(409, 'ORDER_NOT_RETURNABLE', 'Only shipped or delivered orders can be returned');
    const itemMap = new Map(order.items.map((i) => [i.id, i]));
    for (const it of b.items) {
      const oi = itemMap.get(it.orderItemId);
      if (!oi) throw badRequest('ITEM_NOT_IN_ORDER');
      if (it.quantity > oi.quantity - oi.returnedQty) throw badRequest('RETURN_QTY_EXCEEDS', `Only ${oi.quantity - oi.returnedQty} of ${oi.sku} can be returned`);
      if (it.exchangeVariantId) {
        const v = await this.prisma.productVariant.findFirst({ where: { id: it.exchangeVariantId, tenantId: u.tenantId, isActive: true } });
        if (!v) throw notFound('exchange variant');
      }
    }
    const r = await this.prisma.$transaction(async (tx) => {
      const seq = await tx.tenant.update({ where: { id: u.tenantId }, data: { returnSequence: { increment: 1 } }, select: { returnSequence: true } });
      for (const it of b.items) {
        // Reserve the returned quantity so it cannot be requested twice.
        const res = await tx.orderItem.updateMany({
          where: { id: it.orderItemId, returnedQty: { lte: itemMap.get(it.orderItemId)!.quantity - it.quantity } },
          data: { returnedQty: { increment: it.quantity } },
        });
        if (!res.count) throw badRequest('RETURN_QTY_EXCEEDS');
      }
      return tx.returnRequest.create({
        data: {
          tenantId: u.tenantId, number: `R-${seq.returnSequence}`, orderId: order.id, type: b.type, reason: b.reason, reasonNote: b.reasonNote, createdById: u.userId,
          items: { create: b.items.map((i) => ({ tenantId: u.tenantId, orderItemId: i.orderItemId, quantity: i.quantity, exchangeVariantId: i.exchangeVariantId ?? null })) },
        },
      });
    });
    await this.prisma.orderEvent.create({ data: { tenantId: u.tenantId, orderId: order.id, type: 'RETURN_REQUESTED', message: r.number, userId: u.userId } });
    await this.audit.log(u, 'return.created', 'ReturnRequest', r.id, { type: b.type });
    await this.events.publish(u.tenantId, 'return.created', { id: r.id, orderId: order.id, customerId: order.customerId });
    return this.get(u, r.id);
  }

  async transition(u: AuthUser, id: string, b: z.infer<typeof returnTransitionSchema>) {
    const r = await this.prisma.returnRequest.findFirst({ where: { id, tenantId: u.tenantId }, include: detail });
    if (!r) throw notFound('return');
    const next = RETURN_TRANSITIONS[r.status][b.action];
    if (!next) throw new AppError(409, 'INVALID_TRANSITION', `Cannot ${b.action} a ${r.status} return`);

    let replacementOrderId: string | null = null;
    await this.prisma.$transaction(async (tx) => {
      const data: Prisma.ReturnRequestUpdateInput = { status: next, resolutionNote: b.note ?? r.resolutionNote };

      if (b.action === 'REJECT' || b.action === 'CANCEL') {
        for (const it of r.items) await tx.orderItem.update({ where: { id: it.orderItemId }, data: { returnedQty: { decrement: it.quantity } } });
      }
      if (b.action === 'RECEIVE' && b.restock) {
        const loc = b.locationId ?? r.order.locationId ?? (await this.inventory.defaultLocationId(u.tenantId, tx));
        if (b.locationId && !(await tx.location.count({ where: { id: b.locationId, tenantId: u.tenantId } }))) throw notFound('location');
        for (const it of r.items) {
          await this.inventory.move(tx, { tenantId: u.tenantId, variantId: it.orderItem.variantId, locationId: loc, delta: it.quantity, type: 'RETURN_RESTOCK', reference: r.number, userId: u.userId });
        }
        data.restocked = true;
      }
      if (b.action === 'COMPLETE') {
        if (r.type === 'RETURN') {
          const amount = b.refundAmount ?? Math.min(this.suggestedRefund(r), r.order.amountPaid - r.order.amountRefunded);
          await this.orders.recordRefund(tx, u.tenantId, r.orderId, amount, u.userId, r.number);
          data.refundAmount = amount;
        } else {
          // Exchange: create a replacement order; the original item value is credited per unit.
          const overrides = new Map<string, { unitPrice: number; discount: number }>();
          const items = r.items.map((it) => ({ variantId: it.exchangeVariantId!, quantity: it.quantity }));
          const exVariants = await tx.productVariant.findMany({ where: { id: { in: items.map((i) => i.variantId) }, tenantId: u.tenantId } });
          for (const it of r.items) {
            const v = exVariants.find((x) => x.id === it.exchangeVariantId);
            if (!v) throw notFound('exchange variant');
            const creditPerUnit = Math.round(it.orderItem.total / it.orderItem.quantity);
            overrides.set(v.id, { unitPrice: v.price, discount: Math.min(v.price, creditPerUnit) });
          }
          const replacement = await this.orders.createInTx(tx, u.tenantId, u.userId, {
            customerId: r.order.customerId, channel: r.order.channel as never, items, shippingFee: 0, discount: 0,
            notes: `Exchange for return ${r.number}`, locationId: b.locationId ?? r.order.locationId ?? null,
          } as never, { source: `EXCHANGE ${r.number}`, overridePrices: overrides, markPaidIfZero: true });
          replacementOrderId = replacement.id;
          data.replacementOrderId = replacement.id;
        }
      }
      await tx.returnRequest.update({ where: { id }, data });
      await tx.orderEvent.create({ data: { tenantId: u.tenantId, orderId: r.orderId, type: `RETURN_${next}`, message: r.number, userId: u.userId } });
    }, { timeout: 20000 });

    await this.audit.log(u, `return.${b.action.toLowerCase()}`, 'ReturnRequest', id);
    await this.events.publish(u.tenantId, 'return.updated', { id, status: next });
    if (replacementOrderId) await this.orders.afterCreate(u, replacementOrderId, r.items.map((i) => i.exchangeVariantId!));
    await this.redis.invalidatePrefix(`analytics:${u.tenantId}:`);
    return this.get(u, id);
  }
}
