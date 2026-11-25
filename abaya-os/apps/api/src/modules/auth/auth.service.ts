import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ROLE_PERMISSIONS, registerSchema, loginSchema, acceptInviteSchema, changePasswordSchema } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { AuditService } from '../../common/audit.service';
import { AppError, conflict } from '../../common/errors';
import { env } from '../../config/env';
import type { AuthUser } from '../../common/auth';

export interface SessionMeta { userAgent?: string; ip?: string }
const TRIAL_DAYS = 14;
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
  ) {}

  async register(input: z.infer<typeof registerSchema>, meta: SessionMeta) {
    const plan = await this.prisma.plan.findFirst({ where: { isActive: true }, orderBy: { priceMonthly: 'asc' } });
    if (!plan) throw new AppError(503, 'PLANS_NOT_CONFIGURED', 'No subscription plans exist. Run the seed.');
    if (await this.prisma.user.findUnique({ where: { email: input.email } })) throw conflict('EMAIL_TAKEN', 'Email already registered');
    let slug = input.slug;
    if (slug) {
      if (await this.prisma.tenant.findUnique({ where: { slug } })) throw conflict('SLUG_TAKEN', 'Store URL already taken');
    } else {
      slug = await this.generateSlug(input.storeNameEn);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 86400_000);
    const { user, tenant } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: input.email, passwordHash, fullName: input.fullName, locale: input.locale } });
      const tenant = await tx.tenant.create({
        data: { slug, nameAr: input.storeNameAr, nameEn: input.storeNameEn, defaultLocale: input.locale, contactEmail: input.email },
      });
      await tx.membership.create({ data: { tenantId: tenant.id, userId: user.id, role: 'OWNER' } });
      await tx.subscription.create({
        data: { tenantId: tenant.id, planId: plan.id, status: 'TRIALING', trialEndsAt: trialEnd, currentPeriodStart: now, currentPeriodEnd: trialEnd },
      });
      await tx.location.create({ data: { tenantId: tenant.id, name: 'المستودع الرئيسي', isDefault: true } });
      return { user, tenant };
    });
    await this.audit.log({ tenantId: tenant.id, userId: user.id }, 'tenant.registered', 'Tenant', tenant.id);
    return this.issueSession(user.id, tenant.id, meta);
  }

  async login(input: z.infer<typeof loginSchema>, meta: SessionMeta) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { memberships: { where: { isActive: true }, include: { tenant: true }, orderBy: { createdAt: 'asc' } } },
    });
    // Constant-ish time: always run bcrypt.
    const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    const membership = input.tenantSlug
      ? user.memberships.find((m) => m.tenant.slug === input.tenantSlug)
      : user.memberships[0];
    if (!membership) throw new AppError(403, 'NO_STORE_ACCESS', 'No active store membership');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.log({ tenantId: membership.tenantId, userId: user.id }, 'auth.login', 'User', user.id, { ip: meta.ip });
    return this.issueSession(user.id, membership.tenantId, meta);
  }

  async refresh(rawToken: string | undefined, meta: SessionMeta) {
    if (!rawToken) throw new AppError(401, 'REFRESH_MISSING');
    const hash = this.crypto.sha256(rawToken);
    const token = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!token) throw new AppError(401, 'REFRESH_INVALID');
    if (token.revokedAt) {
      // Reuse of a rotated token: revoke the whole family (likely theft).
      await this.prisma.refreshToken.updateMany({ where: { familyId: token.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new AppError(401, 'REFRESH_REUSED', 'Session revoked');
    }
    if (token.expiresAt < new Date()) throw new AppError(401, 'REFRESH_EXPIRED');
    const membership = await this.prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: token.tenantId, userId: token.userId } } });
    if (!membership?.isActive) throw new AppError(401, 'MEMBERSHIP_INACTIVE');
    const session = await this.issueSession(token.userId, token.tenantId, meta, token.familyId);
    await this.prisma.refreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date(), replacedBy: session.refreshTokenId } });
    return session;
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const token = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.crypto.sha256(rawToken) } });
    if (token) await this.prisma.refreshToken.updateMany({ where: { familyId: token.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async switchTenant(user: AuthUser, tenantId: string, meta: SessionMeta) {
    const m = await this.prisma.membership.findUnique({ where: { tenantId_userId: { tenantId, userId: user.userId } } });
    if (!m?.isActive) throw new AppError(403, 'NO_STORE_ACCESS');
    return this.issueSession(user.userId, tenantId, meta);
  }

  async acceptInvite(input: z.infer<typeof acceptInviteSchema>, meta: SessionMeta) {
    const inv = await this.prisma.invitation.findUnique({ where: { tokenHash: this.crypto.sha256(input.token) } });
    if (!inv || inv.acceptedAt || inv.revokedAt || inv.expiresAt < new Date()) throw new AppError(400, 'INVITE_INVALID', 'Invitation is invalid or expired');
    let user = await this.prisma.user.findUnique({ where: { email: inv.email } });
    if (user) {
      // Existing users must prove ownership of the account.
      if (!(await bcrypt.compare(input.password, user.passwordHash))) throw new AppError(401, 'INVALID_CREDENTIALS', 'Use your existing password to accept');
    }
    await this.prisma.$transaction(async (tx) => {
      if (!user) user = await tx.user.create({ data: { email: inv.email, fullName: input.fullName, passwordHash: await bcrypt.hash(input.password, 12) } });
      await tx.membership.upsert({
        where: { tenantId_userId: { tenantId: inv.tenantId, userId: user.id } },
        create: { tenantId: inv.tenantId, userId: user.id, role: inv.role },
        update: { role: inv.role, isActive: true },
      });
      await tx.invitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
    });
    await this.audit.log({ tenantId: inv.tenantId, userId: user!.id }, 'team.invite_accepted', 'Invitation', inv.id);
    return this.issueSession(user!.id, inv.tenantId, meta);
  }

  async changePassword(user: AuthUser, input: z.infer<typeof changePasswordSchema>) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: user.userId } });
    if (!(await bcrypt.compare(input.currentPassword, u.passwordHash))) throw new AppError(400, 'WRONG_PASSWORD');
    await this.prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(input.newPassword, 12) } });
    await this.prisma.refreshToken.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log(user, 'auth.password_changed', 'User', u.id);
    return { ok: true };
  }

  async me(user: AuthUser) {
    const [u, tenant, memberships] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: user.userId }, select: { id: true, email: true, fullName: true, locale: true, isPlatformAdmin: true } }),
      this.prisma.tenant.findUniqueOrThrow({ where: { id: user.tenantId } }),
      this.prisma.membership.findMany({ where: { userId: user.userId, isActive: true }, include: { tenant: { select: { id: true, slug: true, nameAr: true, nameEn: true } } } }),
    ]);
    return {
      user: u,
      tenant,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role],
      memberships: memberships.map((m) => ({ role: m.role, tenant: m.tenant })),
    };
  }

  /** Builds a unique store handle from the English name, falling back to a random one. */
  private async generateSlug(nameEn?: string): Promise<string> {
    const base = (nameEn ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
    for (let i = 0; i < 10; i++) {
      const candidate = base.length >= 3 && i === 0 ? base : `${base.length >= 3 ? base : 'store'}-${this.crypto.randomToken(3).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || i}`;
      if (/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(candidate) && !(await this.prisma.tenant.findUnique({ where: { slug: candidate } }))) return candidate;
    }
    return `store-${Date.now().toString(36)}`;
  }

  private async issueSession(userId: string, tenantId: string, meta: SessionMeta, familyId?: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, tid: tenantId }, { secret: env().JWT_ACCESS_SECRET, expiresIn: env().JWT_ACCESS_TTL as any });
    const refreshToken = this.crypto.randomToken(48);
    const rt = await this.prisma.refreshToken.create({
      data: {
        userId,
        tenantId,
        tokenHash: this.crypto.sha256(refreshToken),
        familyId: familyId ?? this.crypto.randomToken(16),
        expiresAt: new Date(Date.now() + env().JWT_REFRESH_TTL_DAYS * 86400_000),
        userAgent: meta.userAgent?.slice(0, 300),
        ip: meta.ip,
      },
    });
    return { accessToken, refreshToken, refreshTokenId: rt.id, refreshExpiresAt: rt.expiresAt };
  }
}
