import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import { z } from 'zod';
import { apiKeySchema, webhookSchema } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { CryptoService } from '../../common/crypto.service';
import { AuditService } from '../../common/audit.service';
import { EventsService, type DomainEvent } from '../../common/events.service';
import { AppError, notFound } from '../../common/errors';
import type { AuthUser } from '../../common/auth';
import { env } from '../../config/env';

@Injectable()
export class DeveloperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeveloperService.name);
  private queue?: Queue;
  private worker?: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  onModuleInit() {
    this.events.subscribe((t, e, p) => this.fanout(t, e, p));
    if (process.env.NODE_ENV === 'test') return;
    const connection = this.redis.connectionOptions();
    this.queue = new Queue('webhooks', { connection });
    this.worker = new Worker('webhooks', (job) => this.deliver(job.data.deliveryId), { connection, concurrency: 5 });
    this.worker.on('error', (e) => this.logger.error(e.message));
  }
  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  // ---------- API keys ----------
  apiKeys(u: AuthUser) {
    return this.prisma.apiKey.findMany({
      where: { tenantId: u.tenantId }, orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, revokedAt: true, createdAt: true },
    });
  }
  async createApiKey(u: AuthUser, b: z.infer<typeof apiKeySchema>) {
    const raw = `ak_live_${this.crypto.randomToken(32)}`;
    const k = await this.prisma.apiKey.create({
      data: { tenantId: u.tenantId, name: b.name, scopes: b.scopes, prefix: raw.slice(0, 14), keyHash: this.crypto.sha256(raw), createdById: u.userId },
    });
    await this.audit.log(u, 'api_key.created', 'ApiKey', k.id, { scopes: b.scopes });
    return { id: k.id, name: k.name, scopes: k.scopes, prefix: k.prefix, key: raw, note: 'Shown once. Store it securely.' };
  }
  async revokeApiKey(u: AuthUser, id: string) {
    const r = await this.prisma.apiKey.updateMany({ where: { id, tenantId: u.tenantId, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!r.count) throw notFound('api key');
    await this.audit.log(u, 'api_key.revoked', 'ApiKey', id);
    return { ok: true };
  }

  // ---------- Webhooks ----------
  webhooks(u: AuthUser) {
    return this.prisma.webhookEndpoint.findMany({
      where: { tenantId: u.tenantId }, orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true, _count: { select: { deliveries: true } } },
    });
  }
  private assertUrl(url: string) {
    if (env().NODE_ENV === 'production' && !url.startsWith('https://')) throw new AppError(422, 'HTTPS_REQUIRED');
    const host = new URL(url).hostname;
    if (env().NODE_ENV === 'production' && /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[?::1)/.test(host)) {
      throw new AppError(422, 'PRIVATE_ADDRESS_NOT_ALLOWED');
    }
  }
  async createWebhook(u: AuthUser, b: z.infer<typeof webhookSchema>) {
    this.assertUrl(b.url);
    const secret = `whsec_${this.crypto.randomToken(24)}`;
    const w = await this.prisma.webhookEndpoint.create({ data: { tenantId: u.tenantId, url: b.url, events: b.events, isActive: b.isActive, secretEnc: this.crypto.encrypt(secret) } });
    await this.audit.log(u, 'webhook.created', 'WebhookEndpoint', w.id);
    return { id: w.id, url: w.url, events: w.events, isActive: w.isActive, secret, note: 'Shown once. Use it to verify X-Abaya-Signature.' };
  }
  async updateWebhook(u: AuthUser, id: string, b: z.infer<typeof webhookSchema>) {
    this.assertUrl(b.url);
    if (!(await this.prisma.webhookEndpoint.count({ where: { id, tenantId: u.tenantId } }))) throw notFound('webhook');
    return this.prisma.webhookEndpoint.update({ where: { id }, data: { url: b.url, events: b.events, isActive: b.isActive }, select: { id: true, url: true, events: true, isActive: true } });
  }
  async deleteWebhook(u: AuthUser, id: string) {
    const r = await this.prisma.webhookEndpoint.deleteMany({ where: { id, tenantId: u.tenantId } });
    if (!r.count) throw notFound('webhook');
    return { ok: true };
  }
  async deliveries(u: AuthUser, id: string) {
    if (!(await this.prisma.webhookEndpoint.count({ where: { id, tenantId: u.tenantId } }))) throw notFound('webhook');
    return this.prisma.webhookDelivery.findMany({ where: { endpointId: id, tenantId: u.tenantId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }
  async test(u: AuthUser, id: string) {
    const w = await this.prisma.webhookEndpoint.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!w) throw notFound('webhook');
    const d = await this.prisma.webhookDelivery.create({ data: { tenantId: u.tenantId, endpointId: w.id, event: 'ping', payload: { ping: true }, status: 'PENDING' } });
    return this.deliver(d.id);
  }

  private async fanout(tenantId: string, event: DomainEvent, payload: Record<string, unknown>) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({ where: { tenantId, isActive: true, events: { has: event } } });
    for (const e of endpoints) {
      const d = await this.prisma.webhookDelivery.create({ data: { tenantId, endpointId: e.id, event, payload: payload as Prisma.InputJsonValue, status: 'PENDING' } });
      if (this.queue) await this.queue.add('deliver', { deliveryId: d.id }, { attempts: 5, backoff: { type: 'exponential', delay: 10_000 }, removeOnComplete: 1000 });
    }
  }

  /** Signs as HMAC-SHA256(secret, `${timestamp}.${body}`) → X-Abaya-Signature: sha256=<hex>. */
  async deliver(deliveryId: string) {
    const d = await this.prisma.webhookDelivery.findUnique({ where: { id: deliveryId }, include: { endpoint: true } });
    if (!d) return null;
    const body = JSON.stringify({ id: d.id, event: d.event, createdAt: d.createdAt, data: d.payload });
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = this.crypto.hmac(this.crypto.decrypt(d.endpoint.secretEnc), `${ts}.${body}`);
    let status = 'FAILED';
    let code: number | null = null;
    let error: string | null = null;
    try {
      const res = await fetch(d.endpoint.url, {
        method: 'POST', body,
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'AbayaOS-Webhooks/1.0', 'X-Abaya-Event': d.event, 'X-Abaya-Timestamp': ts, 'X-Abaya-Signature': `sha256=${sig}` },
        signal: AbortSignal.timeout(10_000), redirect: 'manual',
      });
      code = res.status;
      status = res.ok ? 'SUCCEEDED' : 'FAILED';
      if (!res.ok) error = `HTTP ${res.status}`;
    } catch (e) {
      error = (e as Error).message.slice(0, 300);
    }
    const updated = await this.prisma.webhookDelivery.update({
      where: { id: d.id },
      data: { status, responseCode: code, error, attempts: { increment: 1 }, deliveredAt: status === 'SUCCEEDED' ? new Date() : null },
    });
    if (status !== 'SUCCEEDED' && d.event !== 'ping') throw new Error(error ?? 'delivery failed'); // let BullMQ retry
    return updated;
  }
}
