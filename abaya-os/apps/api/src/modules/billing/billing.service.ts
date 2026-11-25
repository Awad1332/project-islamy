import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/audit.service';
import { AppError, notFound } from '../../common/errors';
import type { AuthUser } from '../../common/auth';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  plans() {
    return this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: 'asc' } });
  }

  async overview(user: AuthUser) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId: user.tenantId }, include: { plan: true } });
    if (!sub) return { subscription: null, usage: null, invoices: [], gateway: this.gatewayStatus() };
    const [products, staff, invoices] = await Promise.all([
      this.prisma.product.count({ where: { tenantId: user.tenantId, status: { not: 'ARCHIVED' } } }),
      this.prisma.membership.count({ where: { tenantId: user.tenantId, isActive: true } }),
      this.prisma.billingInvoice.findMany({ where: { tenantId: user.tenantId }, orderBy: { createdAt: 'desc' }, take: 24 }),
    ]);
    return {
      subscription: sub,
      usage: {
        products: { used: products, limit: sub.plan.maxProducts },
        staff: { used: staff, limit: sub.plan.maxStaff },
        aiCredits: { used: sub.aiCreditsUsed, limit: sub.plan.aiCreditsMonthly },
      },
      invoices,
      gateway: this.gatewayStatus(),
    };
  }

  /**
   * Platform subscription payments need a platform payment gateway. None is bundled/configured,
   * so self-serve upgrades are refused honestly; platform admins can assign plans manually
   * (e.g. after a bank transfer) from the admin panel.
   */
  gatewayStatus() {
    return { configured: false, provider: null as string | null, message: 'BILLING_GATEWAY_NOT_CONFIGURED' };
  }

  async requestPlanChange(user: AuthUser, planCode: string) {
    const plan = await this.prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan || !plan.isActive) throw notFound('plan');
    const gw = this.gatewayStatus();
    if (!gw.configured && plan.priceMonthly > 0) {
      throw new AppError(503, 'BILLING_GATEWAY_NOT_CONFIGURED', 'Online subscription payment is not configured on this platform. Contact the platform team to upgrade.');
    }
    const sub = await this.prisma.subscription.update({ where: { tenantId: user.tenantId }, data: { planId: plan.id } });
    await this.audit.log(user, 'billing.plan_changed', 'Subscription', sub.id, { plan: plan.code });
    return sub;
  }

  async cancelAtPeriodEnd(user: AuthUser, cancel: boolean) {
    const sub = await this.prisma.subscription.update({ where: { tenantId: user.tenantId }, data: { cancelAtPeriodEnd: cancel } });
    await this.audit.log(user, cancel ? 'billing.cancel_scheduled' : 'billing.cancel_reverted', 'Subscription', sub.id);
    return sub;
  }

  /** Throws when the tenant has consumed its plan quota. */
  async assertProductQuota(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId }, include: { plan: true } });
    if (!sub) return;
    if (sub.status === 'CANCELED') throw new AppError(402, 'SUBSCRIPTION_INACTIVE');
    const count = await this.prisma.product.count({ where: { tenantId, status: { not: 'ARCHIVED' } } });
    if (count >= sub.plan.maxProducts) throw new AppError(402, 'PLAN_LIMIT_PRODUCTS', `Your plan allows ${sub.plan.maxProducts} products`);
  }

  async consumeAiCredit(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId }, include: { plan: true } });
    if (!sub) return;
    const r = await this.prisma.subscription.updateMany({
      where: { tenantId, aiCreditsUsed: { lt: sub.plan.aiCreditsMonthly } },
      data: { aiCreditsUsed: { increment: 1 } },
    });
    if (!r.count) throw new AppError(402, 'AI_CREDITS_EXHAUSTED', 'Monthly AI credits exhausted');
  }

  async refundAiCredit(tenantId: string) {
    await this.prisma.subscription.updateMany({ where: { tenantId, aiCreditsUsed: { gt: 0 } }, data: { aiCreditsUsed: { decrement: 1 } } });
  }
}
