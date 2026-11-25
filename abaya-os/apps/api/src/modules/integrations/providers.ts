import Anthropic from '@anthropic-ai/sdk';
import * as nodemailer from 'nodemailer';
import type { IntegrationProvider } from '@prisma/client';

export interface VerifyResult { ok: boolean; detail?: string }
export interface ProviderDef {
  provider: IntegrationProvider;
  category: 'ai' | 'payments' | 'messaging' | 'email' | 'commerce' | 'images';
  fields: { key: string; secret: boolean; required: boolean }[];
  /** Null means live verification is not implemented — status can never become VERIFIED. */
  verify: ((creds: Record<string, string>) => Promise<VerifyResult>) | null;
  /** What ABAYA OS actually does with this provider once verified. */
  capabilities: string[];
  docs: string;
}

const TIMEOUT = 10_000;
async function httpOk(url: string, init: RequestInit): Promise<VerifyResult> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
    if (res.ok) return { ok: true };
    return { ok: false, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}

export const PROVIDERS: Record<IntegrationProvider, ProviderDef> = {
  ANTHROPIC: {
    provider: 'ANTHROPIC', category: 'ai',
    fields: [{ key: 'apiKey', secret: true, required: true }],
    verify: async (c) => {
      try {
        const client = new Anthropic({ apiKey: c.apiKey, maxRetries: 0, timeout: TIMEOUT });
        await client.models.list({ limit: 1 });
        return { ok: true };
      } catch (e) {
        if (e instanceof Anthropic.AuthenticationError) return { ok: false, detail: 'Invalid API key' };
        if (e instanceof Anthropic.APIError) return { ok: false, detail: `API error ${e.status}` };
        return { ok: false, detail: (e as Error).message };
      }
    },
    capabilities: ['ai_product_content'],
    docs: 'https://docs.claude.com',
  },
  MOYASAR: {
    provider: 'MOYASAR', category: 'payments',
    fields: [{ key: 'secretKey', secret: true, required: true }, { key: 'publishableKey', secret: false, required: false }],
    verify: (c) => httpOk('https://api.moyasar.com/v1/payments?page=1', { headers: { Authorization: `Basic ${Buffer.from(`${c.secretKey}:`).toString('base64')}` } }),
    capabilities: ['credentials_verified_only'],
    docs: 'https://docs.moyasar.com',
  },
  TAP: {
    provider: 'TAP', category: 'payments',
    fields: [{ key: 'secretKey', secret: true, required: true }],
    verify: null,
    capabilities: [],
    docs: 'https://developers.tap.company',
  },
  WHATSAPP_CLOUD: {
    provider: 'WHATSAPP_CLOUD', category: 'messaging',
    fields: [
      { key: 'accessToken', secret: true, required: true },
      { key: 'phoneNumberId', secret: false, required: true },
      { key: 'appSecret', secret: true, required: false },
      { key: 'verifyToken', secret: true, required: false },
    ],
    verify: (c) => httpOk(`https://graph.facebook.com/v21.0/${encodeURIComponent(c.phoneNumberId)}?fields=id,display_phone_number`, { headers: { Authorization: `Bearer ${c.accessToken}` } }),
    capabilities: ['inbox_outbound', 'campaign_send', 'automation_send'],
    docs: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
  },
  INSTAGRAM: {
    provider: 'INSTAGRAM', category: 'messaging',
    fields: [{ key: 'accessToken', secret: true, required: true }, { key: 'igUserId', secret: false, required: true }],
    verify: (c) => httpOk(`https://graph.facebook.com/v21.0/${encodeURIComponent(c.igUserId)}?fields=id,username`, { headers: { Authorization: `Bearer ${c.accessToken}` } }),
    capabilities: ['credentials_verified_only'],
    docs: 'https://developers.facebook.com/docs/instagram-platform',
  },
  SMTP: {
    provider: 'SMTP', category: 'email',
    fields: [
      { key: 'host', secret: false, required: true }, { key: 'port', secret: false, required: true },
      { key: 'user', secret: false, required: true }, { key: 'password', secret: true, required: true },
      { key: 'from', secret: false, required: true },
    ],
    verify: async (c) => {
      try {
        const t = nodemailer.createTransport({ host: c.host, port: Number(c.port), secure: Number(c.port) === 465, auth: { user: c.user, pass: c.password }, connectionTimeout: TIMEOUT });
        await t.verify();
        return { ok: true };
      } catch (e) {
        return { ok: false, detail: (e as Error).message };
      }
    },
    capabilities: ['campaign_send', 'automation_send', 'inbox_outbound'],
    docs: '',
  },
  SALLA: {
    provider: 'SALLA', category: 'commerce',
    fields: [{ key: 'accessToken', secret: true, required: true }],
    verify: (c) => httpOk('https://api.salla.dev/admin/v2/store/info', { headers: { Authorization: `Bearer ${c.accessToken}` } }),
    capabilities: ['credentials_verified_only'],
    docs: 'https://docs.salla.dev',
  },
  ZID: {
    provider: 'ZID', category: 'commerce',
    fields: [{ key: 'authorizationToken', secret: true, required: true }, { key: 'managerToken', secret: true, required: true }],
    verify: null,
    capabilities: [],
    docs: 'https://docs.zid.sa',
  },
  IMAGE_GENERATION: {
    provider: 'IMAGE_GENERATION', category: 'images',
    fields: [{ key: 'endpoint', secret: false, required: true }, { key: 'apiKey', secret: true, required: true }],
    verify: null,
    capabilities: [],
    docs: '',
  },
};
