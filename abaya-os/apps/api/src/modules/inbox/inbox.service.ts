import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { CONVERSATION_STATUSES, channelSchema, conversationSchema, conversationUpdateSchema, messageSchema, paginationSchema } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { AppError, notFound } from '../../common/errors';
import { paged } from '../../common/zod';
import type { AuthUser } from '../../common/auth';
import { SenderService } from '../messaging/sender.service';
import { IntegrationsService } from '../integrations/integrations.service';

export const conversationQuerySchema = paginationSchema.extend({
  status: z.enum(CONVERSATION_STATUSES).optional(),
  channelId: z.string().optional(),
  mine: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: SenderService,
    private readonly integrations: IntegrationsService,
    private readonly crypto: CryptoService,
  ) {}

  async channels(u: AuthUser) {
    const list = await this.prisma.channel.findMany({ where: { tenantId: u.tenantId }, orderBy: { createdAt: 'asc' }, include: { _count: { select: { conversations: true } } } });
    return Promise.all(list.map(async (c) => ({ ...c, deliveryConnected: await this.sender.channelAvailable(u.tenantId, c.type) })));
  }
  createChannel(u: AuthUser, b: z.infer<typeof channelSchema>) {
    return this.prisma.channel.create({ data: { ...b, tenantId: u.tenantId } });
  }
  async deleteChannel(u: AuthUser, id: string) {
    const r = await this.prisma.channel.deleteMany({ where: { id, tenantId: u.tenantId } });
    if (!r.count) throw notFound('channel');
    return { ok: true };
  }

  async conversations(u: AuthUser, q: z.infer<typeof conversationQuerySchema>) {
    const where: Prisma.ConversationWhereInput = {
      tenantId: u.tenantId,
      ...(q.status ? { status: q.status } : {}),
      ...(q.channelId ? { channelId: q.channelId } : {}),
      ...(q.mine ? { assigneeId: u.userId } : {}),
      ...(q.q ? { OR: [{ contactHandle: { contains: q.q } }, { subject: { contains: q.q, mode: 'insensitive' } }] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where, orderBy: { lastMessageAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize,
        include: { channel: { select: { type: true, name: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      this.prisma.conversation.count({ where }),
    ]);
    const customerIds = rows.map((r) => r.customerId).filter(Boolean) as string[];
    const customers = await this.prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, fullName: true } });
    const cMap = new Map(customers.map((c) => [c.id, c.fullName]));
    return paged(rows.map(({ messages, ...r }) => ({ ...r, customerName: r.customerId ? cMap.get(r.customerId) ?? null : null, lastMessage: messages[0] ?? null })), total, q.page, q.pageSize);
  }

  async get(u: AuthUser, id: string) {
    const c = await this.prisma.conversation.findFirst({ where: { id, tenantId: u.tenantId }, include: { channel: true, messages: { orderBy: { createdAt: 'asc' }, take: 500 } } });
    if (!c) throw notFound('conversation');
    if (c.unreadCount) await this.prisma.conversation.update({ where: { id }, data: { unreadCount: 0 } });
    const customer = c.customerId ? await this.prisma.customer.findUnique({ where: { id: c.customerId }, select: { id: true, fullName: true, phone: true, email: true, ordersCount: true, totalSpent: true } }) : null;
    const deliveryConnected = await this.sender.channelAvailable(u.tenantId, c.channel.type);
    return { ...c, unreadCount: 0, customer, deliveryConnected };
  }

  async create(u: AuthUser, b: z.infer<typeof conversationSchema>) {
    if (!(await this.prisma.channel.count({ where: { id: b.channelId, tenantId: u.tenantId } }))) throw notFound('channel');
    if (b.customerId && !(await this.prisma.customer.count({ where: { id: b.customerId, tenantId: u.tenantId } }))) throw notFound('customer');
    return this.prisma.conversation.create({ data: { ...b, tenantId: u.tenantId, assigneeId: u.userId } });
  }

  async update(u: AuthUser, id: string, b: z.infer<typeof conversationUpdateSchema>) {
    if (!(await this.prisma.conversation.count({ where: { id, tenantId: u.tenantId } }))) throw notFound('conversation');
    if (b.assigneeId && !(await this.prisma.membership.count({ where: { userId: b.assigneeId, tenantId: u.tenantId, isActive: true } }))) throw notFound('assignee');
    if (b.customerId && !(await this.prisma.customer.count({ where: { id: b.customerId, tenantId: u.tenantId } }))) throw notFound('customer');
    return this.prisma.conversation.update({ where: { id }, data: b });
  }

  async postMessage(u: AuthUser, id: string, b: z.infer<typeof messageSchema>) {
    const c = await this.prisma.conversation.findFirst({ where: { id, tenantId: u.tenantId }, include: { channel: true } });
    if (!c) throw notFound('conversation');
    if (b.kind === 'NOTE') {
      return this.prisma.message.create({ data: { tenantId: u.tenantId, conversationId: id, direction: 'NOTE', status: 'SENT', body: b.body, authorId: u.userId } });
    }
    const res = await this.sender.send(u.tenantId, c.channel.type, c.contactHandle, b.body, c.subject);
    const msg = await this.prisma.message.create({
      data: { tenantId: u.tenantId, conversationId: id, direction: 'OUTBOUND', status: res.status, body: b.body, authorId: u.userId, externalId: res.externalId, error: res.error },
    });
    await this.prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date(), status: c.status === 'CLOSED' ? 'OPEN' : c.status } });
    return msg;
  }

  // ---------- WhatsApp Cloud inbound webhook ----------
  async verifyWhatsAppSubscription(tenantId: string, mode?: string, token?: string, challenge?: string) {
    const creds = await this.integrations.verifiedCredentials(tenantId, 'WHATSAPP_CLOUD');
    if (!creds?.verifyToken || mode !== 'subscribe' || !token || !this.crypto.safeEqual(token, creds.verifyToken)) throw new AppError(403, 'WEBHOOK_VERIFY_FAILED');
    return challenge ?? '';
  }

  async ingestWhatsApp(tenantId: string, rawBody: Buffer | undefined, signature: string | undefined, body: any) {
    const creds = await this.integrations.verifiedCredentials(tenantId, 'WHATSAPP_CLOUD');
    if (!creds?.appSecret) throw new AppError(403, 'WEBHOOK_NOT_CONFIGURED');
    const expected = `sha256=${this.crypto.hmac(creds.appSecret, (rawBody ?? Buffer.from('')).toString('utf8'))}`;
    if (!signature || !this.crypto.safeEqual(signature, expected)) throw new AppError(401, 'WEBHOOK_SIGNATURE_INVALID');

    let channel = await this.prisma.channel.findFirst({ where: { tenantId, type: 'WHATSAPP' } });
    if (!channel) channel = await this.prisma.channel.create({ data: { tenantId, type: 'WHATSAPP', name: 'WhatsApp', externalId: creds.phoneNumberId } });
    let ingested = 0;
    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value ?? {};
        const names = new Map<string, string>((value.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name]));
        for (const m of value.messages ?? []) {
          const from = `+${String(m.from).replace(/^\+/, '')}`;
          if (await this.prisma.message.findFirst({ where: { tenantId, externalId: m.id } })) continue; // idempotent
          const text = m.type === 'text' ? m.text?.body : `[${m.type}]`;
          const customer = await this.prisma.customer.findFirst({ where: { tenantId, phone: from }, select: { id: true } });
          let conv = await this.prisma.conversation.findFirst({ where: { tenantId, channelId: channel.id, contactHandle: from, status: { not: 'CLOSED' } } });
          if (!conv) conv = await this.prisma.conversation.create({ data: { tenantId, channelId: channel.id, contactHandle: from, customerId: customer?.id ?? null, subject: names.get(m.from) ?? null } });
          await this.prisma.message.create({ data: { tenantId, conversationId: conv.id, direction: 'INBOUND', status: 'RECEIVED', body: String(text ?? '').slice(0, 4000), externalId: m.id } });
          await this.prisma.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: new Date(), unreadCount: { increment: 1 }, status: 'OPEN' } });
          ingested++;
        }
      }
    }
    return { ok: true, ingested };
  }
}
