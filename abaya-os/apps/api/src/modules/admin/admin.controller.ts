import { Controller, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { DEFAULT_VAT_BPS, paginationSchema, planSchema, vatOnNet } from '@abaya/shared';
import { CurrentUser, PlatformAdminOnly, type AuthUser } from '../../common/auth';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/audit.service';
import { ZBody, ZQuery, paged } from '../../common/zod';
import { notFound } from '../../common/errors';

const statusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) });
const assignPlanSchema = z.object({
  planCode: z.string().min(2),
  interval: z.enum(['MONTHLY', 'YEARLY']),
  markPaid: z.boolean().default(false),
  paymentReference: z.string().max(100).optional(),
});

@ApiTags('admin')
@PlatformAdminOnly()
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @Get('metrics')
  async metrics() {
    const [tenants, active, suspended, users, orders, gmv, subs] = await Promise.all([
      this.prisma.tenant.count({ where: { isDemo: false } }),
      this.prisma.tenant.count({ where: { status: 'ACTIVE', isDemo: false } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count(),
      this.prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
      this.prisma.subscription.groupBy({ by: ['status'], _count: true }),
    ]);
    const mrr = await this.prisma.subscription.findMany({ where: { status: 'ACTIVE' }, include: { plan: true } });
    return {
      tenants, activeTenants: active, suspendedTenants: suspended, users, orders,
      gmv: gmv._sum.total ?? 0,
      subscriptions: Object.fromEntries(subs.map((s) => [s.status, s._count])),
      mrr: mrr.reduce((s, x) => s + (x.interval === 'YEARLY' ? Math.round(x.plan.priceYearly / 12) : x.plan.priceMonthly), 0),
    };
  }

  @Get('tenants')
  async tenants(@ZQuery(paginationSchema) q: z.infer<typeof paginationSchema>) {
    const where = q.q ? { OR: [{ slug: { contains: q.q, mode: 'insensitive' as const } }, { nameAr: { contains: q.q } }, { nameEn: { contains: q.q, mode: 'insensitive' as const } }] } : {};
    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize,
        include: { subscription: { include: { plan: { select: { code: true, nameAr: true, nameEn: true } } } }, _count: { select: { memberships: true } } },
      }),
      this.prisma.tenant.count({ where }),
    ]);
    return paged(items, total, q.page, q.pageSize);
  }

  @Patch('tenants/:id/status')
  async setStatus(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(statusSchema) b: z.infer<typeof statusSchema>) {
    const t = await this.prisma.tenant.update({ where: { id }, data: { status: b.status } });
    await this.audit.log({ tenantId: t.id, userId: u.userId }, `admin.tenant_${b.status.toLowerCase()}`, 'Tenant', t.id);
    return t;
  }

  /** Manual plan assignment (bank transfer / offline invoicing). Creates a VAT invoice record. */
  @HttpCode(200)
  @Post('tenants/:id/assign-plan')
  async assignPlan(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(assignPlanSchema) b: z.infer<typeof assignPlanSchema>) {
    const plan = await this.prisma.plan.findUnique({ where: { code: b.planCode } });
    if (!plan) throw notFound('plan');
    const now = new Date();
    const end = new Date(now);
    if (b.interval === 'YEARLY') end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    const net = b.interval === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;
    const vat = vatOnNet(net, DEFAULT_VAT_BPS);
    const sub = await this.prisma.subscription.upsert({
      where: { tenantId: id },
      create: { tenantId: id, planId: plan.id, status: b.markPaid ? 'ACTIVE' : 'PAST_DUE', interval: b.interval, currentPeriodStart: now, currentPeriodEnd: end },
      update: { planId: plan.id, status: b.markPaid ? 'ACTIVE' : 'PAST_DUE', interval: b.interval, currentPeriodStart: now, currentPeriodEnd: end, aiCreditsUsed: 0, trialEndsAt: null },
    });
    const count = await this.prisma.billingInvoice.count();
    const invoice = await this.prisma.billingInvoice.create({
      data: {
        tenantId: id, subscriptionId: sub.id, number: `AOS-${now.getFullYear()}-${String(count + 1).padStart(6, '0')}`,
        amount: net, vatAmount: vat, total: net + vat, status: b.markPaid ? 'PAID' : 'OPEN',
        periodStart: now, periodEnd: end, paidAt: b.markPaid ? now : null, providerRef: b.paymentReference ?? 'MANUAL',
      },
    });
    await this.audit.log({ tenantId: id, userId: u.userId }, 'admin.plan_assigned', 'Subscription', sub.id, { plan: plan.code, invoice: invoice.number });
    return { subscription: sub, invoice };
  }

  @Get('plans')
  plans() {
    return this.prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' }, include: { _count: { select: { subscriptions: true } } } });
  }

  @Post('plans')
  createPlan(@ZBody(planSchema) b: z.infer<typeof planSchema>) {
    return this.prisma.plan.create({ data: b });
  }

  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @ZBody(planSchema) b: z.infer<typeof planSchema>) {
    return this.prisma.plan.update({ where: { id }, data: b });
  }
}
