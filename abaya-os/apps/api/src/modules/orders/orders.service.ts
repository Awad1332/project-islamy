import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  ORDER_TRANSITIONS, computeTotals, createOrderSchema, orderPaymentSchema, orderQuerySchema, orderStatusSchema, type CreateOrderInput,
} from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/audit.service';
import { EventsService } from '../../common/events.service';
import { RedisService } from '../../common/redis.service';
import { InventoryService } from '../inventory/inventory.service';
import { AppError, badRequest, notFound } from '../../common/errors';
import { paged } from '../../common/zod';
import type { AuthUser } from '../../common/auth';
import { zatcaQr } from './zatca';

type Tx = Prisma.TransactionClient;
export interface CreateOpts { source?: string; overridePrices?: Map<string, { unitPrice: number; discount: number }>; markPaidIfZero?: boolean; skipStock?: boolean }

const orderDetail = {
  customer: { select: { id: true, fullName: true, phone: true, email: true, city: true } },
  items: { include: { variant: { select: { productId: true } } } },
  events: { orderBy: { createdAt: 'desc' } },
  payments: { orderBy: { createdAt: 'desc' } },
  returns: { select: { id: true, number: true, type: true, status: true, createdAt: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly inventory: InventoryService,
    private readonly redis: RedisService,
  ) {}

  async list(u: AuthUser, q: z.infer<typeof orderQuerySchema>) {
    const where: Prisma.OrderWhereInput = {
      tenantId: u.tenantId,
      ...(q.status ? { status: q.status } : {}),
      ...(q.paymentStatus ? { paymentStatus: q.paymentStatus } : {}),
      ...(q.customerId ? { customerId: q.customerId } : {}),
      ...(q.q ? { OR: [
        { number: { contains: q.q, mode: 'insensitive' } },
        { customer: { fullName: { contains: q.q, mode: 'insensitive' } } },
        { shippingPhone: { contains: q.q } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where, orderBy: { placedAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize,
        include: { customer: { select: { id: true, fullName: true } }, _count: { select: { items: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paged(items, total, q.page, q.pageSize);
  }

  async get(u: AuthUser, id: string) {
    const o = await this.prisma.order.findFirst({ where: { id, tenantId: u.tenantId }, include: orderDetail });
    if (!o) throw notFound('order');
    return o;
  }

  async create(u: AuthUser, input: CreateOrderInput) {
    const order = await this.prisma.$transaction((tx) => this.createInTx(tx, u.tenantId, u.userId, input), { timeout: 20000 });
    await this.afterCreate(u, order.id, input.items.map((i) => i.variantId));
    return this.get(u, order.id);
  }

  async afterCreate(u: { tenantId: string; userId: string }, orderId: string, variantIds: string[]) {
    await this.audit.log(u, 'order.created', 'Order', orderId);
    await this.events.publish(u.tenantId, 'order.created', { id: orderId });
    await this.inventory.notifyLowStock(u.tenantId, variantIds);
    await this.redis.invalidatePrefix(`analytics:${u.tenantId}:`);
  }

  async createInTx(tx: Tx, tenantId: string, userId: string | undefined, input: CreateOrderInput, opts: CreateOpts = {}) {
    const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    if (input.customerId && !(await tx.customer.count({ where: { id: input.customerId, tenantId } }))) throw notFound('customer');
    const locationId = input.locationId ?? (await this.inventory.defaultLocationId(tenantId, tx));
    if (input.locationId && !(await tx.location.count({ where: { id: input.locationId, tenantId } }))) throw notFound('location');

    const ids = [...new Set(input.items.map((i) => i.variantId))];
    const variants = await tx.productVariant.findMany({ where: { id: { in: ids }, tenantId }, include: { product: { select: { titleAr: true, status: true } } } });
    const byId = new Map(variants.map((v) => [v.id, v]));
    for (const id of ids) {
      const v = byId.get(id);
      if (!v) throw notFound('variant');
      if (!v.isActive || v.product.status === 'ARCHIVED') throw badRequest('VARIANT_UNAVAILABLE', `Variant ${v.sku} is not available`);
    }

    const lines = input.items.map((i) => {
      const override = opts.overridePrices?.get(i.variantId);
      const unitPrice = override?.unitPrice ?? i.unitPrice ?? byId.get(i.variantId)!.price;
      const discount = override ? override.discount * i.quantity : i.discount ?? 0;
      if (discount > unitPrice * i.quantity) throw badRequest('DISCOUNT_EXCEEDS_LINE');
      return { unitPrice, quantity: i.quantity, discount };
    });
    const listedSubtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity - l.discount, 0);
    let shipping = input.shippingFee ?? tenant.defaultShippingFee;
    if (input.shippingFee === undefined && tenant.freeShippingThreshold != null && listedSubtotal >= tenant.freeShippingThreshold) shipping = 0;
    const totals = computeTotals(lines, shipping, tenant, input.discount ?? 0);

    const seq = await tx.tenant.update({ where: { id: tenantId }, data: { orderSequence: { increment: 1 } }, select: { orderSequence: true } });
    const number = String(seq.orderSequence);
    const paid = opts.markPaidIfZero && totals.total === 0;

    const order = await tx.order.create({
      data: {
        tenantId, number, customerId: input.customerId ?? null, channel: input.channel, paymentMethod: input.paymentMethod ?? null, locationId,
        vatRateBps: tenant.vatEnabled ? tenant.vatRateBps : 0, pricesIncludeVat: tenant.pricesIncludeVat,
        subtotal: totals.subtotal, discountTotal: totals.discountTotal, shippingTotal: totals.shippingTotal, vatTotal: totals.vatTotal, total: totals.total,
        paymentStatus: paid ? 'PAID' : 'UNPAID',
        shippingName: input.shippingName, shippingPhone: input.shippingPhone, shippingCity: input.shippingCity, shippingDistrict: input.shippingDistrict,
        shippingAddress: input.shippingAddress, notes: input.notes, giftMessage: input.giftMessage, createdById: userId,
        items: {
          create: input.items.map((i, idx) => {
            const v = byId.get(i.variantId)!;
            const t = totals.lines[idx];
            return {
              tenantId, variantId: v.id, productTitle: v.product.titleAr, sku: v.sku, size: v.size, color: v.color, length: v.length,
              quantity: i.quantity, unitPrice: lines[idx].unitPrice, discount: lines[idx].discount, netTotal: t.net, vatTotal: t.vat, total: t.gross,
            };
          }),
        },
        events: { create: { tenantId, type: 'CREATED', message: opts.source ?? null, userId } },
      },
    });

    if (!opts.skipStock) {
      for (const i of input.items) {
        await this.inventory.move(tx, { tenantId, variantId: i.variantId, locationId, delta: -i.quantity, type: 'SALE', reference: `#${number}`, userId });
      }
    }
    if (input.customerId) {
      await tx.customer.update({ where: { id: input.customerId }, data: { ordersCount: { increment: 1 }, totalSpent: { increment: totals.total }, lastOrderAt: new Date() } });
    }
    return order;
  }

  async updateStatus(u: AuthUser, id: string, b: z.infer<typeof orderStatusSchema>) {
    const order = await this.prisma.order.findFirst({ where: { id, tenantId: u.tenantId }, include: { items: true } });
    if (!order) throw notFound('order');
    if (!ORDER_TRANSITIONS[order.status].includes(b.status)) {
      throw new AppError(409, 'INVALID_TRANSITION', `Cannot move order from ${order.status} to ${b.status}`, { allowed: ORDER_TRANSITIONS[order.status] });
    }
    await this.prisma.$transaction(async (tx) => {
      if (b.status === 'CANCELLED') {
        if (order.amountPaid - order.amountRefunded > 0) throw new AppError(409, 'REFUND_REQUIRED', 'Record a refund before cancelling a paid order');
        const loc = order.locationId ?? (await this.inventory.defaultLocationId(u.tenantId, tx));
        for (const it of order.items) {
          await this.inventory.move(tx, { tenantId: u.tenantId, variantId: it.variantId, locationId: loc, delta: it.quantity, type: 'CANCEL_RESTOCK', reference: `#${order.number}`, userId: u.userId });
        }
        if (order.customerId) {
          await tx.customer.update({ where: { id: order.customerId }, data: { ordersCount: { decrement: 1 }, totalSpent: { decrement: order.total } } });
        }
      }
      await tx.order.update({
        where: { id },
        data: { status: b.status, ...(b.trackingNumber ? { trackingNumber: b.trackingNumber } : {}), ...(b.carrier ? { carrier: b.carrier } : {}) },
      });
      await tx.orderEvent.create({ data: { tenantId: u.tenantId, orderId: id, type: `STATUS_${b.status}`, message: b.note ?? null, userId: u.userId } });
    });
    await this.audit.log(u, 'order.status', 'Order', id, { from: order.status, to: b.status });
    await this.events.publish(u.tenantId, 'order.updated', { id, status: b.status, customerId: order.customerId });
    await this.redis.invalidatePrefix(`analytics:${u.tenantId}:`);
    return this.get(u, id);
  }

  async recordPayment(u: AuthUser, id: string, b: z.infer<typeof orderPaymentSchema>) {
    const order = await this.prisma.order.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!order) throw notFound('order');
    if (order.status === 'CANCELLED') throw new AppError(409, 'ORDER_CANCELLED');
    if (order.amountPaid + b.amount > order.total) throw badRequest('OVERPAYMENT', 'Payment exceeds order balance');
    const paid = order.amountPaid + b.amount;
    await this.prisma.$transaction([
      this.prisma.payment.create({ data: { tenantId: u.tenantId, orderId: id, amount: b.amount, method: b.method, reference: b.reference, kind: 'CAPTURE', provider: 'MANUAL', recordedBy: u.userId } }),
      this.prisma.order.update({ where: { id }, data: { amountPaid: paid, paymentMethod: order.paymentMethod ?? b.method, paymentStatus: paid >= order.total ? 'PAID' : 'UNPAID' } }),
      this.prisma.orderEvent.create({ data: { tenantId: u.tenantId, orderId: id, type: 'PAYMENT_RECORDED', message: `${(b.amount / 100).toFixed(2)} SAR (${b.method})`, userId: u.userId } }),
    ]);
    await this.audit.log(u, 'order.payment', 'Order', id, { amount: b.amount, method: b.method });
    return this.get(u, id);
  }

  async recordRefund(tx: Tx, tenantId: string, orderId: string, amount: number, userId: string | undefined, reference: string) {
    const order = await tx.order.findFirstOrThrow({ where: { id: orderId, tenantId } });
    const refundable = order.amountPaid - order.amountRefunded;
    if (amount > refundable) throw badRequest('REFUND_EXCEEDS_PAID', `Maximum refundable is ${(refundable / 100).toFixed(2)} SAR`);
    if (amount <= 0) return;
    const refunded = order.amountRefunded + amount;
    await tx.payment.create({ data: { tenantId, orderId, amount, method: order.paymentMethod ?? 'MANUAL', kind: 'REFUND', reference, provider: 'MANUAL', recordedBy: userId } });
    await tx.order.update({ where: { id: orderId }, data: { amountRefunded: refunded, paymentStatus: refunded >= order.amountPaid ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } });
    await tx.orderEvent.create({ data: { tenantId, orderId, type: 'REFUND_RECORDED', message: `${(amount / 100).toFixed(2)} SAR — ${reference}`, userId } });
    if (order.customerId) await tx.customer.update({ where: { id: order.customerId }, data: { totalSpent: { decrement: amount } } });
  }

  async invoice(u: AuthUser, id: string) {
    const order = await this.get(u, id);
    const t = await this.prisma.tenant.findUniqueOrThrow({ where: { id: u.tenantId } });
    const qr = t.vatNumber
      ? zatcaQr({ sellerName: t.nameAr, vatNumber: t.vatNumber, timestamp: order.placedAt, total: order.total, vatTotal: order.vatTotal })
      : null;
    return {
      type: 'SIMPLIFIED_TAX_INVOICE',
      seller: { nameAr: t.nameAr, nameEn: t.nameEn, vatNumber: t.vatNumber, commercialRegistration: t.commercialRegistration, city: t.addressCity, address: t.addressLine },
      order,
      zatcaQrBase64: qr,
      warnings: [
        ...(t.vatEnabled && !t.vatNumber ? ['VAT_NUMBER_MISSING'] : []),
        'ZATCA_PHASE2_NOT_INTEGRATED',
      ],
    };
  }
}
