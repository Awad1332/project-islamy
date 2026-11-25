import { Controller, Get, HttpCode, Post, Req, Res, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { acceptInviteSchema, changePasswordSchema, loginSchema, registerSchema } from '@abaya/shared';
import { AuthService } from './auth.service';
import { CurrentUser, Public, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody } from '../../common/zod';
import { env } from '../../config/env';

const COOKIE = 'abaya_rt';
const refreshBody = z.object({ refreshToken: z.string().optional() });

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private meta(req: Request) {
    return { userAgent: req.headers['user-agent'], ip: req.ip };
  }
  private respond(res: Response, s: { accessToken: string; refreshToken: string; refreshExpiresAt: Date }) {
    res.cookie(COOKIE, s.refreshToken, {
      httpOnly: true,
      secure: env().COOKIE_SECURE,
      sameSite: 'lax',
      path: '/api/auth',
      expires: s.refreshExpiresAt,
    });
    return { accessToken: s.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@ZBody(registerSchema) body: z.infer<typeof registerSchema>, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.register(body, this.meta(req)));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(@ZBody(loginSchema) body: z.infer<typeof loginSchema>, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.login(body, this.meta(req)));
  }

  /** Rotates the refresh token. Browser clients use the httpOnly cookie; other clients may send it in the body. */
  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@ZBody(refreshBody) body: z.infer<typeof refreshBody>, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const s = await this.auth.refresh(req.cookies?.[COOKIE] ?? body.refreshToken, this.meta(req));
    const out = this.respond(res, s);
    return body.refreshToken ? { ...out, refreshToken: s.refreshToken } : out;
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[COOKIE] ?? req.body?.refreshToken);
    res.clearCookie(COOKIE, { path: '/api/auth' });
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('accept-invite')
  async acceptInvite(@ZBody(acceptInviteSchema) body: z.infer<typeof acceptInviteSchema>, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.acceptInvite(body, this.meta(req)));
  }

  @RequirePermission()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }

  @RequirePermission()
  @Post('switch-tenant/:tenantId')
  async switch(@CurrentUser() user: AuthUser, @Param('tenantId') tenantId: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.switchTenant(user, tenantId, this.meta(req)));
  }

  @RequirePermission()
  @HttpCode(200)
  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @ZBody(changePasswordSchema) body: z.infer<typeof changePasswordSchema>) {
    return this.auth.changePassword(user, body);
  }
}
