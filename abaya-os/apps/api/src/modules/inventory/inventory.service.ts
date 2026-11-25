import { Injectable } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { z } from 'zod';
import { adjustStockSchema, locationSchema, paginationSchema, transferStockSchema } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/audit.service';
import { EventsService } from '../../common/events.service';
import { AppError, conflict, notFound } from '../../common/errors';
import { paged } from '../../common/zod';
import type { AuthUser } from '../../common/auth';

type Tx = Prisma.TransactionClient;

export const inventoryQuerySchema = paginationSchema.extend({
  locationId: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly events: EventsService) {}

  async defaultLocationId(tenantId: string, tx: Tx = this.prisma): Promise<string> {
    const loc = (await tx.location.findFirst({ where: { tenantId, isDefault: true } })) ?? (await tx.location.findFirst({ where: { tenantId }, orderBy: { createdAt: 'asc' } }));
    if (!loc) throw new AppError(400, 'NO_LOCATION', 'Create an inventory location first');
    return loc.id;
  }

  /**
   * Atomically apply a stock delta. Negative deltas never drive stock below zero unless allowNegative.
   * Must be called inside a transaction.
   */
  async move(tx: Tx, p: { tenantId: string; variantId: string; locationId: string; delta: number; type: StockMovementType; reference?: string; note?: string | null; userId?: string; allowNegative?: boolean }) {
    await tx.inventoryLevel.upsert({
      where: { variantId_locationId: { variantId: p.variantId, locationId: p.locationId } },
      create: { tenantId: p.tenantId, variantId: p.variantId, locationId: p.locationId, onHand: 0 },
      update: {},
    });
    const where: Prisma.InventoryLevelWhereInput = { variantId: p.variantId, locationId: p.locationId, tenantId: p.tenantId };
    if (p.delta < 0 && !p.allowNegative) where.onHand = { gte: -p.delta };
    const r = await tx.inventoryLevel.updateMany({ where, data: { onHand: { increment: p.delta } } });
    if (!r.count) throw new AppError(409, 'INSUFFICIENT_STOCK', 'Insufficient stock', { variantId: p.variantId });
    const level = await tx.inventoryLevel.findUniqueOrThrow({ where: { variantId_locationId: { variantId: p.variantId, locationId: p.locationId } } });
    await tx.stockMovement.create({
      data: { tenantId: p.tenantId, variantId: p.variantId, locationId: p.locationId, type: p.type, quantity: p.delta, balance: level.onHand, reference: p.reference, note: p.note ?? null, userId: p.userId },
    });
    return level.onHand;
  }

  async notifyLowStock(tenantId: string, variantIds: string[]) {
    if (!variantIds.length) return;
    const t = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { lowStockThreshold: true } });
    const levels = await this.prisma.inventoryLevel.groupBy({ by: ['variantId'], where: { tenantId, variantId: { in: variantIds } }, _sum: { onHand: true } });
    for (const l of levels) {
      if ((l._sum.onHand ?? 0) <= (t?.lowStockThreshold ?? 0)) {
        await this.events.publish(tenantId, 'inventory.low_stock', { variantId: l.variantId, onHand: l._sum.onHand ?? 0 });
      }
    }
  }

  // ---------- Locations ----------
  locations(u: AuthUser) {
    return this.prisma.location.findMany({ where: { tenantId: u.tenantId }, orderBy: { createdAt: 'asc' } });
  }
  async createLocation(u: AuthUser, b: z.infer<typeof locationSchema>) {
    return this.prisma.$transaction(async (tx) => {
      if (b.isDefault) await tx.location.updateMany({ where: { tenantId: u.tenantId }, data: { isDefault: false } });
      return tx.location.create({ data: { ...b, tenantId: u.tenantId } });
    });
  }
  async updateLocation(u: AuthUser, id: string, b: z.infer<typeof locationSchema>) {
    if (!(await this.prisma.location.count({ where: { id, tenantId: u.tenantId } }))) throw notFound('location');
    return this.prisma.$transaction(async (tx) => {
      if (b.isDefault) await tx.location.updateMany({ where: { tenantId: u.tenantId }, data: { isDefault: false } });
      return tx.location.update({ where: { id }, data: b });
    });
  }
  async deleteLocation(u: AuthUser, id: string) {
    const loc = await this.prisma.location.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!loc) throw notFound('location');
    const stock = await this.prisma.inventoryLevel.aggregate({ where: { locationId: id }, _sum: { onHand: true } });
    if ((stock._sum.onHand ?? 0) !== 0) throw conflict('LOCATION_HAS_STOCK', 'Transfer stock out before deleting');
    if (loc.isDefault) throw conflict('LOCATION_IS_DEFAULT');
    await this.prisma.location.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- Levels ----------
  async list(u: AuthUser, q: z.infer<typeof inventoryQuerySchema>) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: u.tenantId }, select: { lowStockThreshold: true } });
    const where: Prisma.ProductVariantWhereInput = {
      tenantId: u.tenantId,
      product: { status: { not: 'ARCHIVED' } },
      ...(q.q ? { OR: [{ sku: { contains: q.q, mode: 'insensitive' } }, { product: { titleAr: { contains: q.q, mode: 'insensitive' } } }] } : {}),
    };
    if (q.lowStock) {
      // Variants whose total on-hand is ≤ threshold (including no inventory rows at all).
      const sums = await this.prisma.inventoryLevel.groupBy({ by: ['variantId'], where: { tenantId: u.tenantId }, _sum: { onHand: true } });
      const healthy = sums.filter((s) => (s._sum.onHand ?? 0) > tenant.lowStockThreshold).map((s) => s.variantId);
      where.id = { notIn: healthy };
    }
    const [rows, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where, skip: (q.page - 1) * q.pageSize, take: q.pageSize, orderBy: [{ product: { titleAr: 'asc' } }, { sku: 'asc' }],
        include: { product: { select: { id: true, titleAr: true, titleEn: true } }, inventory: { include: { location: { select: { name: true } } } } },
      }),
      this.prisma.productVariant.count({ where }),
    ]);
    const items = rows.map((v) => {
      const levels = q.locationId ? v.inventory.filter((l) => l.locationId === q.locationId) : v.inventory;
      const onHand = levels.reduce((s, l) => s + l.onHand, 0);
      return { ...v, onHand, low: onHand <= tenant.lowStockThreshold };
    });
    return { ...paged(items, total, q.page, q.pageSize), threshold: tenant.lowStockThreshold };
  }

  private async assertVariantAndLocation(u: AuthUser, variantId: string, ...locationIds: string[]) {
    if (!(await this.prisma.productVariant.count({ where: { id: variantId, tenantId: u.tenantId } }))) throw notFound('variant');
    const locs = await this.prisma.location.count({ where: { id: { in: locationIds }, tenantId: u.tenantId } });
    if (locs !== new Set(locationIds).size) throw notFound('location');
  }

  async adjust(u: AuthUser, b: z.infer<typeof adjustStockSchema>) {
    await this.assertVariantAndLocation(u, b.variantId, b.locationId);
    if (b.type === 'RECEIPT' && b.quantity < 0) throw new AppError(400, 'RECEIPT_MUST_BE_POSITIVE');
    const balance = await this.prisma.$transaction((tx) =>
      this.move(tx, { tenantId: u.tenantId, variantId: b.variantId, locationId: b.locationId, delta: b.quantity, type: b.type, note: b.note, userId: u.userId }),
    );
    await this.audit.log(u, 'inventory.adjusted', 'ProductVariant', b.variantId, { delta: b.quantity, type: b.type, balance });
    await this.notifyLowStock(u.tenantId, [b.variantId]);
    return { variantId: b.variantId, locationId: b.locationId, onHand: balance };
  }

  async transfer(u: AuthUser, b: z.infer<typeof transferStockSchema>) {
    await this.assertVariantAndLocation(u, b.variantId, b.fromLocationId, b.toLocationId);
    const ref = `TRF-${Date.now().toString(36).toUpperCase()}`;
    await this.prisma.$transaction(async (tx) => {
      await this.move(tx, { tenantId: u.tenantId, variantId: b.variantId, locationId: b.fromLocationId, delta: -b.quantity, type: 'TRANSFER_OUT', reference: ref, note: b.note, userId: u.userId });
      await this.move(tx, { tenantId: u.tenantId, variantId: b.variantId, locationId: b.toLocationId, delta: b.quantity, type: 'TRANSFER_IN', reference: ref, note: b.note, userId: u.userId });
    });
    await this.audit.log(u, 'inventory.transferred', 'ProductVariant', b.variantId, { ...b, reference: ref });
    return { ok: true, reference: ref };
  }

  async movements(u: AuthUser, variantId: string | undefined, page: number, pageSize: number) {
    const where: Prisma.StockMovementWhereInput = { tenantId: u.tenantId, ...(variantId ? { variantId } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.stockMovement.count({ where }),
    ]);
    const variantIds = [...new Set(items.map((i) => i.variantId))];
    const locationIds = [...new Set(items.map((i) => i.locationId))];
    const [variants, locations] = await Promise.all([
      this.prisma.productVariant.findMany({ where: { id: { in: variantIds } }, select: { id: true, sku: true, product: { select: { titleAr: true } } } }),
      this.prisma.location.findMany({ where: { id: { in: locationIds } }, select: { id: true, name: true } }),
    ]);
    const vMap = new Map(variants.map((v) => [v.id, v]));
    const lMap = new Map(locations.map((l) => [l.id, l.name]));
    return paged(items.map((i) => ({ ...i, sku: vMap.get(i.variantId)?.sku, productTitle: vMap.get(i.variantId)?.product.titleAr, locationName: lMap.get(i.locationId) })), total, page, pageSize);
  }
}
