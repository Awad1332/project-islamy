import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { assignableRoles, inviteSchema, tenantSettingsSchema, type Role } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { AuditService } from '../../common/audit.service';
import { AppError, forbidden, notFound } from '../../common/errors';
import type { AuthUser } from '../../common/auth';
import { env } from '../../config/env';
import { paged } from '../../common/zod';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService, private readonly crypto: CryptoService, private readonly audit: AuditService) {}

  getSettings(user: AuthUser) {
    return this.prisma.tenant.findUniqueOrThrow({ where: { id: user.tenantId } });
  }

  async updateSettings(user: AuthUser, input: z.infer<typeof tenantSettingsSchema>) {
    const data = { ...input, vatNumber: input.vatNumber || null, commercialRegistration: input.commercialRegistration || null };
    if (data.vatEnabled && !data.vatNumber) {
      // Allowed (small merchants may be below the registration threshold) but surfaced in onboarding.
    }
    const t = await this.prisma.tenant.update({ where: { id: user.tenantId }, data });
    await this.audit.log(user, 'settings.updated', 'Tenant', t.id, { vatRateBps: t.vatRateBps, vatEnabled: t.vatEnabled });
    return t;
  }

  // ---- Team ----
  async listTeam(user: AuthUser) {
    const [members, invitations] = await Promise.all([
      this.prisma.membership.findMany({
        where: { tenantId: user.tenantId },
        include: { user: { select: { id: true, email: true, fullName: true, lastLoginAt: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.invitation.findMany({
        where: { tenantId: user.tenantId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      }),
    ]);
    return { members, invitations, assignableRoles: assignableRoles(user.role) };
  }

  async invite(user: AuthUser, input: z.infer<typeof inviteSchema>) {
    if (!assignableRoles(user.role).includes(input.role)) throw forbidden('ROLE_ESCALATION', 'You cannot assign this role');
    await this.assertStaffLimit(user.tenantId);
    const existing = await this.prisma.membership.findFirst({ where: { tenantId: user.tenantId, user: { email: input.email }, isActive: true } });
    if (existing) throw new AppError(409, 'ALREADY_MEMBER');
    const token = this.crypto.randomToken(32);
    await this.prisma.invitation.updateMany({ where: { tenantId: user.tenantId, email: input.email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    const inv = await this.prisma.invitation.create({
      data: {
        tenantId: user.tenantId, email: input.email, role: input.role, invitedById: user.userId,
        tokenHash: this.crypto.sha256(token), expiresAt: new Date(Date.now() + 7 * 86400_000),
      },
    });
    await this.audit.log(user, 'team.invited', 'Invitation', inv.id, { email: input.email, role: input.role });
    // No email provider is bundled: the link is returned to the inviter to share. Delivery via SMTP
    // happens only when an SMTP integration is verified (see integrations module).
    return { id: inv.id, email: inv.email, role: inv.role, expiresAt: inv.expiresAt, inviteUrl: `${env().APP_URL}/accept-invite?token=${token}` };
  }

  async revokeInvite(user: AuthUser, id: string) {
    const r = await this.prisma.invitation.updateMany({ where: { id, tenantId: user.tenantId, acceptedAt: null }, data: { revokedAt: new Date() } });
    if (!r.count) throw notFound('invitation');
    return { ok: true };
  }

  async updateMember(user: AuthUser, membershipId: string, role: Role) {
    const m = await this.prisma.membership.findFirst({ where: { id: membershipId, tenantId: user.tenantId } });
    if (!m) throw notFound('member');
    if (m.role === 'OWNER') throw forbidden('OWNER_PROTECTED');
    if (m.userId === user.userId) throw forbidden('CANNOT_CHANGE_SELF');
    const allowed = assignableRoles(user.role);
    if (!allowed.includes(role) || !allowed.includes(m.role)) throw forbidden('ROLE_ESCALATION');
    const updated = await this.prisma.membership.update({ where: { id: m.id }, data: { role } });
    await this.audit.log(user, 'team.role_changed', 'Membership', m.id, { from: m.role, to: role });
    return updated;
  }

  async removeMember(user: AuthUser, membershipId: string) {
    const m = await this.prisma.membership.findFirst({ where: { id: membershipId, tenantId: user.tenantId } });
    if (!m) throw notFound('member');
    if (m.role === 'OWNER') throw forbidden('OWNER_PROTECTED');
    if (m.userId === user.userId) throw forbidden('CANNOT_REMOVE_SELF');
    if (!assignableRoles(user.role).includes(m.role)) throw forbidden('ROLE_ESCALATION');
    await this.prisma.$transaction([
      this.prisma.membership.update({ where: { id: m.id }, data: { isActive: false } }),
      this.prisma.refreshToken.updateMany({ where: { userId: m.userId, tenantId: user.tenantId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.audit.log(user, 'team.removed', 'Membership', m.id);
    return { ok: true };
  }

  private async assertStaffLimit(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId }, include: { plan: true } });
    if (!sub) return;
    const count = await this.prisma.membership.count({ where: { tenantId, isActive: true } });
    const pending = await this.prisma.invitation.count({ where: { tenantId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } } });
    if (count + pending >= sub.plan.maxStaff) throw new AppError(402, 'PLAN_LIMIT_STAFF', `Your plan allows ${sub.plan.maxStaff} team members`);
  }

  // ---- Audit ----
  async auditLog(user: AuthUser, page: number, pageSize: number) {
    const where = { tenantId: user.tenantId };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.auditLog.count({ where }),
    ]);
    const userIds = [...new Set(items.map((i) => i.userId).filter(Boolean))] as string[];
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true } });
    const names = Object.fromEntries(users.map((u) => [u.id, u.fullName]));
    return paged(items.map((i) => ({ ...i, userName: i.userId ? names[i.userId] ?? null : null })), total, page, pageSize);
  }

  // ---- Onboarding (computed from real data) ----
  async onboarding(user: AuthUser) {
    const t = await this.prisma.tenant.findUniqueOrThrow({ where: { id: user.tenantId } });
    const [products, charts, team, verifiedIntegrations, orders, stock] = await Promise.all([
      this.prisma.product.count({ where: { tenantId: t.id } }),
      this.prisma.sizeChart.count({ where: { tenantId: t.id } }),
      this.prisma.membership.count({ where: { tenantId: t.id, isActive: true } }),
      this.prisma.integration.count({ where: { tenantId: t.id, status: 'VERIFIED' } }),
      this.prisma.order.count({ where: { tenantId: t.id } }),
      this.prisma.inventoryLevel.count({ where: { tenantId: t.id, onHand: { gt: 0 } } }),
    ]);
    const steps = [
      { key: 'store_profile', done: Boolean(t.contactPhone && t.addressCity), href: '/settings' },
      { key: 'vat', done: !t.vatEnabled || Boolean(t.vatNumber), href: '/settings' },
      { key: 'size_chart', done: charts > 0, href: '/sizing' },
      { key: 'first_product', done: products > 0, href: '/products/new' },
      { key: 'stock', done: stock > 0, href: '/inventory' },
      { key: 'team', done: team > 1, href: '/settings/team' },
      { key: 'integration', done: verifiedIntegrations > 0, href: '/integrations' },
      { key: 'first_order', done: orders > 0, href: '/orders/new' },
    ];
    return { steps, completed: steps.filter((s) => s.done).length, total: steps.length, dismissed: t.onboardingDismissed };
  }

  async dismissOnboarding(user: AuthUser, dismissed: boolean) {
    await this.prisma.tenant.update({ where: { id: user.tenantId }, data: { onboardingDismissed: dismissed } });
    return { ok: true };
  }
}
