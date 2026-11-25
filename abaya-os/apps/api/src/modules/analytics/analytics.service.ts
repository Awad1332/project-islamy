import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import type { AuthUser } from '../../common/auth';

const RIYADH_DAY = Prisma.sql`to_char(("placedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Riyadh', 'YYYY-MM-DD')`;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  range(from?: Date, to?: Date) {
    const end = to ?? new Date();
    const start = from ?? new Date(end.getTime() - 29 * 86400_000);
    return { start, end };
  }

  overview(u: AuthUser, from?: Date, to?: Date) {
    const { start, end } = this.range(from, to);
    const key = `analytics:${u.tenantId}:overview:${start.toISOString().slice(0, 13)}:${end.toISOString().slice(0, 13)}`;
    return this.redis.cached(key, 60, () => this.compute(u.tenantId, start, end));
  }

  private async compute(tenantId: string, start: Date, end: Date) {
    const where: Prisma.OrderWhereInput = { tenantId, placedAt: { gte: start, lte: end } };
    const valid: Prisma.OrderWhereInput = { ...where, status: { not: 'CANCELLED' } };
    const [agg, byStatus, byChannel, newCustomers, returns, returnReasons, cancelled] = await Promise.all([
      this.prisma.order.aggregate({ where: valid, _sum: { total: true, vatTotal: true, amountRefunded: true, discountTotal: true }, _count: true }),
      this.prisma.order.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.order.groupBy({ by: ['channel'], where: valid, _count: true, _sum: { total: true } }),
      this.prisma.customer.count({ where: { tenantId, createdAt: { gte: start, lte: end } } }),
      this.prisma.returnRequest.count({ where: { tenantId, createdAt: { gte: start, lte: end }, status: { notIn: ['REJECTED', 'CANCELLED'] } } }),
      this.prisma.returnRequest.groupBy({ by: ['reason'], where: { tenantId, createdAt: { gte: start, lte: end } }, _count: true }),
      this.prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    const daily = await this.prisma.$queryRaw<{ day: string; revenue: bigint; orders: bigint }[]>`
      SELECT ${RIYADH_DAY} AS day, COALESCE(SUM(total),0)::bigint AS revenue, COUNT(*)::bigint AS orders
      FROM "Order" WHERE "tenantId" = ${tenantId} AND "placedAt" BETWEEN ${start} AND ${end} AND status <> 'CANCELLED'
      GROUP BY day ORDER BY day`;

    const topProducts = await this.prisma.$queryRaw<{ productId: string; title: string; units: bigint; revenue: bigint }[]>`
      SELECT v."productId", MAX(oi."productTitle") AS title, SUM(oi.quantity)::bigint AS units, SUM(oi.total)::bigint AS revenue
      FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId" JOIN "ProductVariant" v ON v.id = oi."variantId"
      WHERE o."tenantId" = ${tenantId} AND o."placedAt" BETWEEN ${start} AND ${end} AND o.status <> 'CANCELLED'
      GROUP BY v."productId" ORDER BY units DESC LIMIT 10`;

    const sizes = await this.prisma.$queryRaw<{ size: string; length: string | null; units: bigint }[]>`
      SELECT oi.size, oi.length, SUM(oi.quantity)::bigint AS units
      FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
      WHERE o."tenantId" = ${tenantId} AND o."placedAt" BETWEEN ${start} AND ${end} AND o.status <> 'CANCELLED'
      GROUP BY oi.size, oi.length ORDER BY units DESC LIMIT 20`;

    const units = topProducts.reduce((s, p) => s + Number(p.units), 0);
    const revenue = agg._sum.total ?? 0;
    const orders = agg._count;

    // Fill missing days so charts are continuous.
    const map = new Map(daily.map((d) => [d.day, d]));
    const series: { day: string; revenue: number; orders: number }[] = [];
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' });
    for (let t = start.getTime(); t <= end.getTime() + 1; t += 86400_000) {
      const day = fmt.format(new Date(t));
      if (series.at(-1)?.day === day) continue;
      const d = map.get(day);
      series.push({ day, revenue: d ? Number(d.revenue) : 0, orders: d ? Number(d.orders) : 0 });
    }

    return {
      range: { from: start, to: end, timezone: 'Asia/Riyadh', currency: 'SAR' },
      kpis: {
        revenue, orders, averageOrderValue: orders ? Math.round(revenue / orders) : 0,
        vatCollected: agg._sum.vatTotal ?? 0, refunded: agg._sum.amountRefunded ?? 0, discounts: agg._sum.discountTotal ?? 0,
        newCustomers, returns, returnRate: orders ? Number((returns / orders).toFixed(4)) : 0, cancelled,
      },
      series,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byChannel: byChannel.map((c) => ({ channel: c.channel, count: c._count, revenue: c._sum.total ?? 0 })),
      topProducts: topProducts.map((p) => ({ productId: p.productId, title: p.title, units: Number(p.units), revenue: Number(p.revenue), share: units ? Number(p.units) / units : 0 })),
      sizes: sizes.map((s) => ({ size: s.size, length: s.length, units: Number(s.units) })),
      returnReasons: returnReasons.map((r) => ({ reason: r.reason, count: r._count })),
    };
  }

  async dashboard(u: AuthUser) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: u.tenantId }, select: { lowStockThreshold: true } });
    const startOfDay = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
    startOfDay.setHours(0, 0, 0, 0);
    const offsetMs = new Date().getTime() - new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })).getTime();
    const todayStart = new Date(startOfDay.getTime() + offsetMs);
    const [today, pendingOrders, openReturns, openConversations, levels, recentOrders] = await Promise.all([
      this.prisma.order.aggregate({ where: { tenantId: u.tenantId, placedAt: { gte: todayStart }, status: { not: 'CANCELLED' } }, _sum: { total: true }, _count: true }),
      this.prisma.order.count({ where: { tenantId: u.tenantId, status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } } }),
      this.prisma.returnRequest.count({ where: { tenantId: u.tenantId, status: { in: ['REQUESTED', 'APPROVED', 'RECEIVED'] } } }),
      this.prisma.conversation.count({ where: { tenantId: u.tenantId, status: 'OPEN' } }),
      this.prisma.inventoryLevel.groupBy({ by: ['variantId'], where: { tenantId: u.tenantId }, _sum: { onHand: true } }),
      this.prisma.order.findMany({ where: { tenantId: u.tenantId }, orderBy: { placedAt: 'desc' }, take: 6, include: { customer: { select: { fullName: true } } } }),
    ]);
    return {
      todayRevenue: today._sum.total ?? 0,
      todayOrders: today._count,
      pendingOrders, openReturns, openConversations,
      lowStockVariants: levels.filter((l) => (l._sum.onHand ?? 0) <= tenant.lowStockThreshold).length,
      recentOrders,
      last30: await this.overview(u),
    };
  }
}
