import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { categorySchema, productQuerySchema, type ProductInput } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/audit.service';
import { EventsService } from '../../common/events.service';
import { BillingService } from '../billing/billing.service';
import { InventoryService } from '../inventory/inventory.service';
import { AppError, conflict, notFound } from '../../common/errors';
import { paged } from '../../common/zod';
import type { AuthUser } from '../../common/auth';

const productInclude = {
  category: { select: { id: true, nameAr: true, nameEn: true } },
  sizeChart: { select: { id: true, name: true } },
  variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }, { length: 'asc' }], include: { inventory: { select: { onHand: true, locationId: true } } } },
  images: { orderBy: { position: 'asc' } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
    private readonly billing: BillingService,
    private readonly inventory: InventoryService,
  ) {}

  // ---------- Categories ----------
  categories(u: AuthUser) {
    return this.prisma.category.findMany({ where: { tenantId: u.tenantId }, orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }], include: { _count: { select: { products: true } } } });
  }
  createCategory(u: AuthUser, b: z.infer<typeof categorySchema>) {
    return this.prisma.category.create({ data: { ...b, tenantId: u.tenantId } });
  }
  async updateCategory(u: AuthUser, id: string, b: z.infer<typeof categorySchema>) {
    await this.ownCategory(u, id);
    return this.prisma.category.update({ where: { id }, data: b });
  }
  async deleteCategory(u: AuthUser, id: string) {
    await this.ownCategory(u, id);
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
  private async ownCategory(u: AuthUser, id: string) {
    const c = await this.prisma.category.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!c) throw notFound('category');
    return c;
  }

  // ---------- Products ----------
  async list(u: AuthUser, q: z.infer<typeof productQuerySchema>) {
    const where: Prisma.ProductWhereInput = {
      tenantId: u.tenantId,
      ...(q.status ? { status: q.status } : { status: { not: 'ARCHIVED' } }),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.q ? { OR: [
        { titleAr: { contains: q.q, mode: 'insensitive' } },
        { titleEn: { contains: q.q, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: q.q, mode: 'insensitive' } } } },
      ] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy: { updatedAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize,
        include: {
          category: { select: { nameAr: true, nameEn: true } },
          images: { take: 1, orderBy: { position: 'asc' } },
          variants: { select: { price: true, inventory: { select: { onHand: true } } } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    const items = rows.map(({ variants, images, ...p }) => {
      const prices = variants.map((v) => v.price);
      return {
        ...p,
        image: images[0]?.url ?? null,
        variantCount: variants.length,
        stock: variants.reduce((s, v) => s + v.inventory.reduce((a, l) => a + l.onHand, 0), 0),
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
      };
    });
    return paged(items, total, q.page, q.pageSize);
  }

  async get(u: AuthUser, id: string) {
    const p = await this.prisma.product.findFirst({ where: { id, tenantId: u.tenantId }, include: productInclude });
    if (!p) throw notFound('product');
    return p;
  }

  private async assertRefs(u: AuthUser, b: ProductInput) {
    if (b.categoryId && !(await this.prisma.category.count({ where: { id: b.categoryId, tenantId: u.tenantId } }))) throw notFound('category');
    if (b.sizeChartId && !(await this.prisma.sizeChart.count({ where: { id: b.sizeChartId, tenantId: u.tenantId } }))) throw notFound('size chart');
  }

  private productData(b: ProductInput) {
    const { variants: _v, slug, ...rest } = b;
    return slug ? { ...rest, slug } : rest;
  }

  private variantData(v: ProductInput['variants'][number]) {
    const { id: _id, initialStock: _s, ...rest } = v;
    return rest;
  }

  /** Unique per-tenant product handle when the merchant didn't supply one. */
  private async uniqueSlug(tenantId: string, preferred?: string) {
    if (preferred) return preferred;
    for (let i = 0; i < 5; i++) {
      const slug = `abaya-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
      if (!(await this.prisma.product.count({ where: { tenantId, slug } }))) return slug;
    }
    return `abaya-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /** Receives `initialStock` for newly created variants into the default location. */
  private async receiveInitialStock(u: AuthUser, created: { id: string; sku: string }[], input: ProductInput['variants']) {
    const wanted = input.filter((v) => !v.id && (v.initialStock ?? 0) > 0);
    if (!wanted.length) return;
    const locationId = await this.inventory.defaultLocationId(u.tenantId);
    const bySku = new Map(created.map((c) => [c.sku.toLowerCase(), c.id]));
    await this.prisma.$transaction(async (tx) => {
      for (const v of wanted) {
        const variantId = bySku.get(v.sku.toLowerCase());
        if (variantId) await this.inventory.move(tx, { tenantId: u.tenantId, variantId, locationId, delta: v.initialStock!, type: 'RECEIPT', note: 'initial stock', userId: u.userId });
      }
    }, { timeout: 30000 });
  }

  async create(u: AuthUser, b: ProductInput) {
    await this.billing.assertProductQuota(u.tenantId);
    await this.assertRefs(u, b);
    const slug = await this.uniqueSlug(u.tenantId, b.slug);
    const created = await this.prisma.product.create({
      data: {
        ...this.productData(b),
        slug,
        tenantId: u.tenantId,
        variants: { create: b.variants.map((v) => ({ ...this.variantData(v), tenantId: u.tenantId })) },
      },
      include: { variants: { select: { id: true, sku: true } } },
    });
    await this.receiveInitialStock(u, created.variants, b.variants);
    const p = await this.get(u, created.id);
    await this.audit.log(u, 'product.created', 'Product', p.id, { title: p.titleAr });
    await this.events.publish(u.tenantId, 'product.updated', { id: p.id, action: 'created' });
    return p;
  }

  async update(u: AuthUser, id: string, b: ProductInput) {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId: u.tenantId }, include: { variants: { select: { id: true } } } });
    if (!existing) throw notFound('product');
    await this.assertRefs(u, b);
    const existingIds = new Set(existing.variants.map((v) => v.id));
    for (const v of b.variants) if (v.id && !existingIds.has(v.id)) throw new AppError(400, 'VARIANT_NOT_IN_PRODUCT');
    const keep = new Set(b.variants.filter((v) => v.id).map((v) => v.id!));
    const removed = [...existingIds].filter((vid) => !keep.has(vid));

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: this.productData(b) });
      if (removed.length) {
        const sold = await tx.orderItem.findMany({ where: { variantId: { in: removed } }, select: { variantId: true }, distinct: ['variantId'] });
        const soldIds = new Set(sold.map((s) => s.variantId));
        // Variants with order history are deactivated, never deleted, to preserve order integrity.
        if (soldIds.size) await tx.productVariant.updateMany({ where: { id: { in: [...soldIds] } }, data: { isActive: false } });
        const deletable = removed.filter((r) => !soldIds.has(r));
        if (deletable.length) await tx.productVariant.deleteMany({ where: { id: { in: deletable } } });
      }
      for (const v of b.variants) {
        if (v.id) await tx.productVariant.update({ where: { id: v.id }, data: this.variantData(v) });
        else await tx.productVariant.create({ data: { ...this.variantData(v), productId: id, tenantId: u.tenantId } });
      }
    });
    const fresh = await this.prisma.productVariant.findMany({ where: { productId: id }, select: { id: true, sku: true } });
    await this.receiveInitialStock(u, fresh, b.variants);
    await this.audit.log(u, 'product.updated', 'Product', id);
    await this.events.publish(u.tenantId, 'product.updated', { id, action: 'updated' });
    return this.get(u, id);
  }

  async setStatus(u: AuthUser, id: string, status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED') {
    const p = await this.prisma.product.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!p) throw notFound('product');
    if (p.status === 'ARCHIVED' && status !== 'ARCHIVED') await this.billing.assertProductQuota(u.tenantId);
    const r = await this.prisma.product.update({ where: { id }, data: { status } });
    await this.audit.log(u, 'product.status', 'Product', id, { status });
    return r;
  }

  async remove(u: AuthUser, id: string) {
    const p = await this.prisma.product.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!p) throw notFound('product');
    const sold = await this.prisma.orderItem.count({ where: { variant: { productId: id } } });
    if (sold) throw conflict('PRODUCT_HAS_ORDERS', 'Product has orders; archive it instead');
    await this.prisma.product.delete({ where: { id } });
    await this.audit.log(u, 'product.deleted', 'Product', id, { title: p.titleAr });
    return { ok: true };
  }

  async duplicate(u: AuthUser, id: string) {
    const p = await this.get(u, id);
    await this.billing.assertProductQuota(u.tenantId);
    const suffix = Date.now().toString(36).slice(-4);
    const copy = await this.prisma.product.create({
      data: {
        tenantId: u.tenantId, titleAr: `${p.titleAr} (نسخة)`, titleEn: p.titleEn ? `${p.titleEn} (copy)` : null,
        descriptionAr: p.descriptionAr, descriptionEn: p.descriptionEn, slug: `${p.slug}-${suffix}`.slice(0, 100), status: 'DRAFT',
        categoryId: p.categoryId, sizeChartId: p.sizeChartId, cut: p.cut, fabric: p.fabric, sleeveType: p.sleeveType, closure: p.closure,
        embellishment: p.embellishment, opacity: p.opacity, occasions: p.occasions, includesShayla: p.includesShayla,
        careInstructionsAr: p.careInstructionsAr, careInstructionsEn: p.careInstructionsEn, tags: p.tags,
        variants: { create: p.variants.map((v) => ({
          tenantId: u.tenantId, sku: `${v.sku}-${suffix}`.slice(0, 64), size: v.size, color: v.color, colorHex: v.colorHex, length: v.length,
          price: v.price, compareAtPrice: v.compareAtPrice, costPrice: v.costPrice, weightGrams: v.weightGrams, isActive: v.isActive,
        })) },
      },
    });
    await this.audit.log(u, 'product.duplicated', 'Product', copy.id, { from: id });
    return copy;
  }

  // ---------- Images ----------
  async addImage(u: AuthUser, productId: string, assetId: string, color?: string | null) {
    await this.get(u, productId);
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: assetId, tenantId: u.tenantId } });
    if (!asset) throw notFound('media');
    const pos = await this.prisma.productImage.count({ where: { productId } });
    return this.prisma.productImage.create({ data: { tenantId: u.tenantId, productId, assetId, url: asset.url, position: pos, color: color ?? null } });
  }
  async removeImage(u: AuthUser, productId: string, imageId: string) {
    const r = await this.prisma.productImage.deleteMany({ where: { id: imageId, productId, tenantId: u.tenantId } });
    if (!r.count) throw notFound('image');
    return { ok: true };
  }
  async reorderImages(u: AuthUser, productId: string, ids: string[]) {
    await this.get(u, productId);
    await this.prisma.$transaction(ids.map((id, i) => this.prisma.productImage.updateMany({ where: { id, productId, tenantId: u.tenantId }, data: { position: i } })));
    return { ok: true };
  }

  /** Searchable variant picker used by orders/returns. */
  async searchVariants(u: AuthUser, q: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        tenantId: u.tenantId, isActive: true, product: { status: { not: 'ARCHIVED' } },
        ...(q ? { OR: [{ sku: { contains: q, mode: 'insensitive' } }, { product: { titleAr: { contains: q, mode: 'insensitive' } } }, { product: { titleEn: { contains: q, mode: 'insensitive' } } }] } : {}),
      },
      take: 25,
      include: { product: { select: { titleAr: true, titleEn: true } }, inventory: { select: { onHand: true, locationId: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return variants.map((v) => ({ ...v, stock: v.inventory.reduce((s, l) => s + l.onHand, 0) }));
  }
}
