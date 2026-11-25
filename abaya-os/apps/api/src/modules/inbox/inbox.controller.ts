import { Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, Headers, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { channelSchema, conversationSchema, conversationUpdateSchema, messageSchema } from '@abaya/shared';
import { CurrentUser, Public, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody, ZQuery } from '../../common/zod';
import { InboxService, conversationQuerySchema } from './inbox.service';

@ApiTags('inbox')
@Controller()
export class InboxController {
  constructor(private readonly svc: InboxService) {}

  @RequirePermission('inbox:read') @Get('inbox/channels')
  channels(@CurrentUser() u: AuthUser) { return this.svc.channels(u); }
  @RequirePermission('integrations:manage') @Post('inbox/channels')
  createChannel(@CurrentUser() u: AuthUser, @ZBody(channelSchema) b: z.infer<typeof channelSchema>) { return this.svc.createChannel(u, b); }
  @RequirePermission('integrations:manage') @Delete('inbox/channels/:id')
  deleteChannel(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.deleteChannel(u, id); }

  @RequirePermission('inbox:read') @Get('inbox/conversations')
  list(@CurrentUser() u: AuthUser, @ZQuery(conversationQuerySchema) q: z.infer<typeof conversationQuerySchema>) { return this.svc.conversations(u, q); }
  @RequirePermission('inbox:read') @Get('inbox/conversations/:id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.get(u, id); }
  @RequirePermission('inbox:write') @Post('inbox/conversations')
  create(@CurrentUser() u: AuthUser, @ZBody(conversationSchema) b: z.infer<typeof conversationSchema>) { return this.svc.create(u, b); }
  @RequirePermission('inbox:write') @Patch('inbox/conversations/:id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(conversationUpdateSchema) b: z.infer<typeof conversationUpdateSchema>) { return this.svc.update(u, id, b); }
  @RequirePermission('inbox:write') @Post('inbox/conversations/:id/messages')
  post(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(messageSchema) b: z.infer<typeof messageSchema>) { return this.svc.postMessage(u, id, b); }

  /** Meta webhook subscription handshake. */
  @Public() @Get('webhooks/whatsapp/:tenantId')
  verify(@Param('tenantId') t: string, @Query('hub.mode') mode?: string, @Query('hub.verify_token') token?: string, @Query('hub.challenge') challenge?: string) {
    return this.svc.verifyWhatsAppSubscription(t, mode, token, challenge);
  }
  /** Inbound WhatsApp messages; verified with X-Hub-Signature-256 (HMAC of raw body with the app secret). */
  @Public() @Throttle({ default: { limit: 300, ttl: 60_000 } }) @HttpCode(200) @Post('webhooks/whatsapp/:tenantId')
  inbound(@Param('tenantId') t: string, @Req() req: RawBodyRequest<Request>, @Headers('x-hub-signature-256') sig: string | undefined, @Body() body: unknown) {
    return this.svc.ingestWhatsApp(t, req.rawBody, sig, body);
  }
}
