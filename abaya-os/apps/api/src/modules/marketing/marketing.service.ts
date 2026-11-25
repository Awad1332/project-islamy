import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import { z } from 'zod';
import { automationSchema, campaignSchema, segmentRuleSchema, segmentSchema } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { AuditService } from '../../common/audit.service';
import { EventsService, type DomainEvent } from '../../common/events.service';
import { AppError, integrationNotConnected, notFound } from '../../common/errors';
import type { AuthUser } from '../../common/auth';
import { SenderService } from '../messaging/sender.service';

type Rules = z.infer<typeof segmentRuleSchema>;

export function segmentWhere(tenantId: string, r: Rules, marketingOnly: boolean): Prisma.CustomerWhereInput {
  const and: Prisma.CustomerWhereInput[] = [{ tenantId }];
  if (r.minOrders != null) and.push({ ordersCount: { gte: r.minOrders } });
  if (r.maxOrders != null) and.push({ ordersCount: { lte: r.maxOrders } });
  if (r.minSpent != null) and.push({ totalSpent: { gte: r.minSpent } });
  if (r.lastOrderWithinDays) and.push({ lastOrderAt: { gte: new Date(Date.now() - r.lastOrderWithinDays * 86400_000) } });
  if (r.noOrderForDays) and.push({ OR: [{ lastOrderAt: null }, { lastOrderAt: { lt: new Date(Date.now() - r.noOrderForDays * 86400_000) } }] });
  if (r.cities?.length) and.push({ city: { in: r.cities } });
  if (r.tags?.length) and.push({ tags: { hasSome: r.tags } });
  if (r.acceptsMarketing != null) and.push({ acceptsMarketing: r.acceptsMarketing });
  // Marketing sends always require opt-in consent (Saudi PDPL).
  if (marketingOnly) and.push({ acceptsMarketing: true });
  return { AND: and };
}

export function renderTemplate(body: string, vars: Record<string, string | undefined | null>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k: string) => vars[k] ?? '');
}

const TRIGGER_FOR: Partial<Record<DomainEvent, string>> = {
  'order.created': 'ORDER_CREATED',
  'customer.created': 'CUSTOMER_CREATED',
  'return.created': 'RETURN_REQUESTED',
};

@Injectable()
export class MarketingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketingService.name);
  private queue?: Queue;
  private worker?: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly sender: SenderService,
  ) {}

  onModuleInit() {
    this.events.subscribe((tenantId, event, payload) => this.onEvent(tenantId, event, payload));
    if (process.env.NODE_ENV === 'test') return;
    const connection = this.redis.connectionOptions();
    this.queue = new Queue('marketing', { connection });
    this.worker = new Worker('marketing', async (job) => {
      if (job.name === 'campaign') await this.runCampaign(job.data.campaignId);
      if (job.name === 'automation') await this.runAutomation(job.data.runId);
    }, { connection, concurrency: 2 });
    this.worker.on('error', (e) => this.logger.error(e.message));
  }
  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  // ---------- Segments ----------
  async segments(u: AuthUser) {
    const list = await this.prisma.segment.findMany({ where: { tenantId: u.tenantId }, orderBy: { createdAt: 'desc' } });
    return Promise.all(list.map(async (s) => ({
      ...s,
      customerCount: await this.prisma.customer.count({ where: segmentWhere(u.tenantId, s.rules as Rules, false) }),
      reachableCount: await this.prisma.customer.count({ where: segmentWhere(u.tenantId, s.rules as Rules, true) }),
    })));
  }
  async previewSegment(u: AuthUser, rules: Rules) {
    const where = segmentWhere(u.tenantId, rules, false);
    const [count, reachable, sample] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.count({ where: segmentWhere(u.tenantId, rules, true) }),
      this.prisma.customer.findMany({ where, take: 10, orderBy: { totalSpent: 'desc' }, select: { id: true, fullName: true, city: true, ordersCount: true, totalSpent: true } }),
    ]);
    return { count, reachable, sample };
  }
  createSegment(u: AuthUser, b: z.infer<typeof segmentSchema>) {
    return this.prisma.segment.create({ data: { tenantId: u.tenantId, name: b.name, description: b.description, rules: b.rules as Prisma.InputJsonValue } });
  }
  async updateSegment(u: AuthUser, id: string, b: z.infer<typeof segmentSchema>) {
    await this.own('segment', u, id);
    return this.prisma.segment.update({ where: { id }, data: { name: b.name, description: b.description, rules: b.rules as Prisma.InputJsonValue } });
  }
  async deleteSegment(u: AuthUser, id: string) {
    await this.own('segment', u, id);
    if (await this.prisma.campaign.count({ where: { segmentId: id } })) throw new AppError(409, 'SEGMENT_IN_USE');
    await this.prisma.segment.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- Campaigns ----------
  async campaigns(u: AuthUser) {
    const [items, channels] = await Promise.all([
      this.prisma.campaign.findMany({ where: { tenantId: u.tenantId }, orderBy: { createdAt: 'desc' }, include: { segment: { select: { name: true } } } }),
      this.channelStatus(u.tenantId),
    ]);
    return { items, channels };
  }
  async channelStatus(tenantId: string) {
    return {
      EMAIL: await this.sender.channelAvailable(tenantId, 'EMAIL'),
      WHATSAPP: await this.sender.channelAvailable(tenantId, 'WHATSAPP'),
      SMS: await this.sender.channelAvailable(tenantId, 'SMS'),
    };
  }
  async createCampaign(u: AuthUser, b: z.infer<typeof campaignSchema>) {
    await this.own('segment', u, b.segmentId);
    return this.prisma.campaign.create({ data: { ...b, tenantId: u.tenantId, status: 'DRAFT', scheduledAt: b.scheduledAt ?? null } });
  }
  async updateCampaign(u: AuthUser, id: string, b: z.infer<typeof campaignSchema>) {
    const c = await this.own('campaign', u, id);
    if (!['DRAFT', 'SCHEDULED'].includes(c.status)) throw new AppError(409, 'CAMPAIGN_LOCKED');
    await this.own('segment', u, b.segmentId);
    return this.prisma.campaign.update({ where: { id }, data: { ...b, status: 'DRAFT', scheduledAt: b.scheduledAt ?? null } });
  }
  async deleteCampaign(u: AuthUser, id: string) {
    const c = await this.own('campaign', u, id);
    if (c.status === 'SENDING') throw new AppError(409, 'CAMPAIGN_LOCKED');
    await this.prisma.campaign.delete({ where: { id } });
    return { ok: true };
  }
  /** Send now or schedule. Requires the channel to be connected and verified. */
  async launchCampaign(u: AuthUser, id: string, scheduleAt?: Date | null) {
    const c = await this.own('campaign', u, id);
    if (!['DRAFT', 'SCHEDULED', 'FAILED'].includes(c.status)) throw new AppError(409, 'CAMPAIGN_LOCKED');
    if (!(await this.sender.channelAvailable(u.tenantId, c.channel))) throw integrationNotConnected(c.channel === 'EMAIL' ? 'SMTP' : c.channel === 'WHATSAPP' ? 'WHATSAPP_CLOUD' : 'SMS');
    if (scheduleAt && scheduleAt > new Date()) {
      await this.prisma.campaign.update({ where: { id }, data: { status: 'SCHEDULED', scheduledAt: scheduleAt } });
    } else {
      await this.prisma.campaign.update({ where: { id }, data: { status: 'SENDING', lastError: null } });
      await this.enqueueCampaign(id);
    }
    await this.audit.log(u, 'campaign.launched', 'Campaign', id, { scheduleAt });
    return this.prisma.campaign.findUniqueOrThrow({ where: { id } });
  }
  async cancelCampaign(u: AuthUser, id: string) {
    const c = await this.own('campaign', u, id);
    if (c.status !== 'SCHEDULED') throw new AppError(409, 'NOT_SCHEDULED');
    return this.prisma.campaign.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  private async enqueueCampaign(id: string) {
    if (this.queue) await this.queue.add('campaign', { campaignId: id }, { jobId: `campaign-${id}-${Date.now()}`, removeOnComplete: 100 });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchScheduled() {
    if (process.env.NODE_ENV === 'test') return;
    const due = await this.prisma.campaign.findMany({ where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } }, take: 20 });
    for (const c of due) {
      const r = await this.prisma.campaign.updateMany({ where: { id: c.id, status: 'SCHEDULED' }, data: { status: 'SENDING' } });
      if (r.count) await this.enqueueCampaign(c.id);
    }
  }

  async runCampaign(id: string) {
    const c = await this.prisma.campaign.findUnique({ where: { id }, include: { segment: true } });
    if (!c || c.status !== 'SENDING') return;
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: c.tenantId } });
    if (!(await this.sender.channelAvailable(c.tenantId, c.channel))) {
      await this.prisma.campaign.update({ where: { id }, data: { status: 'FAILED', lastError: 'CHANNEL_NOT_CONNECTED' } });
      return;
    }
    const recipients = await this.prisma.customer.findMany({ where: segmentWhere(c.tenantId, c.segment.rules as Rules, true) });
    let sent = 0;
    let failed = 0;
    let lastError: string | null = null;
    for (const r of recipients) {
      const to = c.channel === 'EMAIL' ? r.email : r.phone;
      const res = await this.sender.send(c.tenantId, c.channel, to, renderTemplate(c.bodyAr, { name: r.fullName, store: tenant.nameAr }), c.subject);
      if (res.status === 'SENT') sent++;
      else { failed++; lastError = res.error ?? null; }
    }
    await this.prisma.campaign.update({
      where: { id },
      data: { status: sent === 0 && recipients.length > 0 ? 'FAILED' : 'SENT', sentAt: new Date(), recipientCount: recipients.length, sentCount: sent, failedCount: failed, lastError },
    });
  }

  // ---------- Automations ----------
  async automations(u: AuthUser) {
    const [items, runs, channels] = await Promise.all([
      this.prisma.automation.findMany({ where: { tenantId: u.tenantId }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { runs: true } } } }),
      this.prisma.automationRun.findMany({ where: { tenantId: u.tenantId }, orderBy: { createdAt: 'desc' }, take: 30, include: { automation: { select: { name: true } } } }),
      this.channelStatus(u.tenantId),
    ]);
    return { items, runs, channels };
  }
  createAutomation(u: AuthUser, b: z.infer<typeof automationSchema>) {
    return this.prisma.automation.create({ data: { ...b, tenantId: u.tenantId } });
  }
  async updateAutomation(u: AuthUser, id: string, b: z.infer<typeof automationSchema>) {
    await this.own('automation', u, id);
    return this.prisma.automation.update({ where: { id }, data: b });
  }
  async deleteAutomation(u: AuthUser, id: string) {
    await this.own('automation', u, id);
    await this.prisma.automation.delete({ where: { id } });
    return { ok: true };
  }

  private async onEvent(tenantId: string, event: DomainEvent, payload: Record<string, unknown>) {
    let trigger = TRIGGER_FOR[event];
    if (event === 'order.updated' && payload.status === 'DELIVERED') trigger = 'ORDER_DELIVERED';
    if (!trigger) return;
    const autos = await this.prisma.automation.findMany({ where: { tenantId, isActive: true, trigger: trigger as never } });
    if (!autos.length) return;
    let customerId = (payload.customerId as string | undefined) ?? null;
    if (!customerId && event === 'customer.created') customerId = payload.id as string;
    if (!customerId && event === 'order.created') customerId = (await this.prisma.order.findUnique({ where: { id: payload.id as string }, select: { customerId: true } }))?.customerId ?? null;
    for (const a of autos) {
      const runAt = new Date(Date.now() + a.delayMinutes * 60_000);
      const run = await this.prisma.automationRun.create({ data: { tenantId, automationId: a.id, customerId, entityId: (payload.id as string) ?? null, status: 'SCHEDULED', runAt } });
      if (this.queue) await this.queue.add('automation', { runId: run.id }, { delay: a.delayMinutes * 60_000, removeOnComplete: 500 });
    }
  }

  async runAutomation(runId: string) {
    const run = await this.prisma.automationRun.findUnique({ where: { id: runId }, include: { automation: true } });
    if (!run || run.status !== 'SCHEDULED') return;
    const finish = (status: string, detail?: string | null) => this.prisma.automationRun.update({ where: { id: runId }, data: { status, detail: detail ?? null } });
    if (!run.automation.isActive) return finish('SKIPPED', 'AUTOMATION_DISABLED');
    if (!run.customerId) return finish('SKIPPED', 'NO_CUSTOMER');
    const customer = await this.prisma.customer.findUnique({ where: { id: run.customerId } });
    if (!customer) return finish('SKIPPED', 'CUSTOMER_DELETED');
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: run.tenantId } });
    let orderNumber: string | undefined;
    if (run.entityId) orderNumber = (await this.prisma.order.findFirst({ where: { id: run.entityId, tenantId: run.tenantId }, select: { number: true } }))?.number;
    const to = run.automation.channel === 'EMAIL' ? customer.email : customer.phone;
    const res = await this.sender.send(run.tenantId, run.automation.channel, to, renderTemplate(run.automation.bodyAr, { name: customer.fullName, store: tenant.nameAr, order_number: orderNumber }), tenant.nameAr);
    return finish(res.status === 'SENT' ? 'SENT' : res.status === 'NOT_SENT' ? 'SKIPPED' : 'FAILED', res.error);
  }

  private async own(kind: 'segment' | 'campaign' | 'automation', u: AuthUser, id: string): Promise<any> {
    const model = this.prisma[kind] as any;
    const row = await model.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!row) throw notFound(kind);
    return row;
  }
}
