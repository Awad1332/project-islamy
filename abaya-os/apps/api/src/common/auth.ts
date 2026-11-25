import {
  CanActivate, ExecutionContext, Injectable, SetMetadata, createParamDecorator, applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { hasPermission, type Permission, type Role } from '@abaya/shared';
import type { Request } from 'express';
import { AppError } from './errors';
import { PrismaService } from './prisma.service';
import { CryptoService } from './crypto.service';
import { env } from '../config/env';

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: Role;
  isPlatformAdmin: boolean;
  email: string;
}
export interface ApiKeyPrincipal {
  apiKeyId: string;
  tenantId: string;
  scopes: string[];
}

const IS_PUBLIC = 'isPublic';
const PERMS = 'permissions';
const PLATFORM = 'platformAdmin';
const API_KEY = 'apiKeyScopes';

export const Public = () => SetMetadata(IS_PUBLIC, true);
export const RequirePermission = (...perms: Permission[]) => applyDecorators(SetMetadata(PERMS, perms), ApiBearerAuth());
export const PlatformAdminOnly = () => applyDecorators(SetMetadata(PLATFORM, true), ApiBearerAuth());
export const ApiKeyAuth = (...scopes: string[]) => applyDecorators(SetMetadata(API_KEY, scopes), ApiSecurity('api-key'));

export const CurrentUser = createParamDecorator((_d: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
export const CurrentApiKey = createParamDecorator((_d: unknown, ctx: ExecutionContext): ApiKeyPrincipal => {
  return ctx.switchToHttp().getRequest().apiKey;
});

export interface AccessPayload { sub: string; tid: string }

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser; apiKey?: ApiKeyPrincipal }>();

    const apiScopes = this.reflector.getAllAndOverride<string[]>(API_KEY, targets);
    if (apiScopes) return this.checkApiKey(req, apiScopes);

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new AppError(401, 'UNAUTHENTICATED', 'Missing access token');
    let payload: AccessPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessPayload>(header.slice(7), { secret: env().JWT_ACCESS_SECRET });
    } catch {
      throw new AppError(401, 'TOKEN_INVALID', 'Access token invalid or expired');
    }
    const membership = await this.prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId: payload.tid, userId: payload.sub } },
      include: { user: { select: { email: true, isPlatformAdmin: true } }, tenant: { select: { status: true } } },
    });
    if (!membership || !membership.isActive) throw new AppError(401, 'MEMBERSHIP_INACTIVE', 'No active membership');
    const user: AuthUser = {
      userId: payload.sub,
      tenantId: payload.tid,
      role: membership.role,
      isPlatformAdmin: membership.user.isPlatformAdmin,
      email: membership.user.email,
    };
    req.user = user;

    if (this.reflector.getAllAndOverride<boolean>(PLATFORM, targets)) {
      if (!user.isPlatformAdmin) throw new AppError(403, 'PLATFORM_ADMIN_REQUIRED');
      return true;
    }
    if (membership.tenant.status === 'SUSPENDED' && !user.isPlatformAdmin)
      throw new AppError(403, 'TENANT_SUSPENDED', 'This store is suspended');

    const perms = this.reflector.getAllAndOverride<Permission[]>(PERMS, targets) ?? [];
    for (const p of perms) {
      if (!hasPermission(user.role, p)) throw new AppError(403, 'PERMISSION_DENIED', `Missing permission ${p}`);
    }
    return true;
  }

  private async checkApiKey(req: Request & { apiKey?: ApiKeyPrincipal }, scopes: string[]) {
    const raw = req.headers['x-api-key'];
    if (typeof raw !== 'string' || !raw.startsWith('ak_')) throw new AppError(401, 'API_KEY_REQUIRED');
    const key = await this.prisma.apiKey.findUnique({ where: { keyHash: this.crypto.sha256(raw) } });
    if (!key || key.revokedAt) throw new AppError(401, 'API_KEY_INVALID');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: key.tenantId }, select: { status: true } });
    if (tenant?.status !== 'ACTIVE') throw new AppError(403, 'TENANT_SUSPENDED');
    for (const s of scopes) if (!key.scopes.includes(s)) throw new AppError(403, 'API_KEY_SCOPE', `Missing scope ${s}`);
    req.apiKey = { apiKeyId: key.id, tenantId: key.tenantId, scopes: key.scopes };
    this.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
    return true;
  }
}
