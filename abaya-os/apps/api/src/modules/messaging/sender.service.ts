import { Global, Injectable, Module } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IntegrationsService } from '../integrations/integrations.service';

export type OutChannel = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'INSTAGRAM' | 'WEBCHAT';
export interface SendResult { status: 'SENT' | 'FAILED' | 'NOT_SENT'; externalId?: string; error?: string }

/**
 * Delivers outbound messages ONLY through integrations whose credentials were verified live.
 * Anything else is recorded as NOT_SENT with an explicit reason — never silently "sent".
 */
@Injectable()
export class SenderService {
  constructor(private readonly integrations: IntegrationsService) {}

  async channelAvailable(tenantId: string, channel: OutChannel): Promise<boolean> {
    if (channel === 'EMAIL') return Boolean(await this.integrations.verifiedCredentials(tenantId, 'SMTP'));
    if (channel === 'WHATSAPP') return Boolean(await this.integrations.verifiedCredentials(tenantId, 'WHATSAPP_CLOUD'));
    return false; // SMS / Instagram DM / webchat delivery adapters are not implemented.
  }

  async send(tenantId: string, channel: OutChannel, to: string | null | undefined, body: string, subject?: string | null): Promise<SendResult> {
    if (!to) return { status: 'NOT_SENT', error: 'RECIPIENT_MISSING' };
    if (channel === 'EMAIL') {
      const c = await this.integrations.verifiedCredentials(tenantId, 'SMTP');
      if (!c) return { status: 'NOT_SENT', error: 'CHANNEL_NOT_CONNECTED' };
      try {
        const t = nodemailer.createTransport({ host: c.host, port: Number(c.port), secure: Number(c.port) === 465, auth: { user: c.user, pass: c.password } });
        const info = await t.sendMail({ from: c.from, to, subject: subject ?? '', text: body });
        return { status: 'SENT', externalId: info.messageId };
      } catch (e) {
        return { status: 'FAILED', error: (e as Error).message.slice(0, 300) };
      }
    }
    if (channel === 'WHATSAPP') {
      const c = await this.integrations.verifiedCredentials(tenantId, 'WHATSAPP_CLOUD');
      if (!c) return { status: 'NOT_SENT', error: 'CHANNEL_NOT_CONNECTED' };
      try {
        const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(c.phoneNumberId)}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${c.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaging_product: 'whatsapp', to: to.replace(/^\+/, ''), type: 'text', text: { body } }),
          signal: AbortSignal.timeout(15000),
        });
        const json = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message: string } };
        if (!res.ok) return { status: 'FAILED', error: json.error?.message?.slice(0, 300) ?? `HTTP ${res.status}` };
        return { status: 'SENT', externalId: json.messages?.[0]?.id };
      } catch (e) {
        return { status: 'FAILED', error: (e as Error).message.slice(0, 300) };
      }
    }
    return { status: 'NOT_SENT', error: 'CHANNEL_ADAPTER_NOT_IMPLEMENTED' };
  }
}

@Global()
@Module({ providers: [SenderService], exports: [SenderService] })
export class MessagingModule {}
