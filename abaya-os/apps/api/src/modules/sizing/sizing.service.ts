import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { recommendSchema, recommendSize, sizeChartSchema, type Measurements, type SizeChartDef } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/audit.service';
import { AppError, notFound } from '../../common/errors';
import type { AuthUser } from '../../common/auth';

@Injectable()
export class SizingService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(u: AuthUser) {
    return this.prisma.sizeChart.findMany({ where: { tenantId: u.tenantId }, orderBy: { createdAt: 'asc' }, include: { _count: { select: { products: true } } } });
  }
  async get(u: AuthUser, id: string) {
    const c = await this.prisma.sizeChart.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!c) throw notFound('size chart');
    return c;
  }

  private validateRows(b: z.infer<typeof sizeChartSchema>) {
    const labels = new Set<string>();
    for (const r of b.rows) {
      if (labels.has(r.label)) throw new AppError(422, 'DUPLICATE_SIZE_LABEL', r.label);
      labels.add(r.label);
    }
    const used = Object.entries(b.weights).filter(([, w]) => (w ?? 0) > 0).map(([k]) => k);
    if (!used.length) throw new AppError(422, 'NO_WEIGHTED_MEASUREMENT', 'At least one measurement must have weight > 0');
  }

  async create(u: AuthUser, b: z.infer<typeof sizeChartSchema>) {
    this.validateRows(b);
    const c = await this.prisma.$transaction(async (tx) => {
      if (b.isDefault) await tx.sizeChart.updateMany({ where: { tenantId: u.tenantId }, data: { isDefault: false } });
      return tx.sizeChart.create({ data: { ...b, tenantId: u.tenantId } as Prisma.SizeChartUncheckedCreateInput });
    });
    await this.audit.log(u, 'size_chart.created', 'SizeChart', c.id);
    return c;
  }

  async update(u: AuthUser, id: string, b: z.infer<typeof sizeChartSchema>) {
    await this.get(u, id);
    this.validateRows(b);
    return this.prisma.$transaction(async (tx) => {
      if (b.isDefault) await tx.sizeChart.updateMany({ where: { tenantId: u.tenantId }, data: { isDefault: false } });
      return tx.sizeChart.update({ where: { id }, data: b as Prisma.SizeChartUpdateInput });
    });
  }

  async remove(u: AuthUser, id: string) {
    await this.get(u, id);
    await this.prisma.sizeChart.delete({ where: { id } });
    return { ok: true };
  }

  async recommend(tenantId: string, b: z.infer<typeof recommendSchema>) {
    let chartId = b.sizeChartId;
    if (!chartId && b.productId) {
      const p = await this.prisma.product.findFirst({ where: { id: b.productId, tenantId }, select: { sizeChartId: true } });
      if (!p) throw notFound('product');
      chartId = p.sizeChartId ?? (await this.prisma.sizeChart.findFirst({ where: { tenantId, isDefault: true } }))?.id;
      if (!chartId) throw new AppError(422, 'NO_SIZE_CHART', 'Product has no size chart and no default chart exists');
    }
    const chart = await this.prisma.sizeChart.findFirst({ where: { id: chartId, tenantId } });
    if (!chart) throw notFound('size chart');

    let m: Measurements & { fitPreference?: 'SNUG' | 'REGULAR' | 'LOOSE'; wearsHeels?: boolean };
    if (b.measurements) m = b.measurements as typeof m;
    else {
      const rec = await this.prisma.customerMeasurement.findFirst({
        where: { tenantId, customerId: b.customerId, ...(b.measurementId ? { id: b.measurementId } : {}) },
        orderBy: { updatedAt: 'desc' },
      });
      if (!rec) throw new AppError(422, 'NO_MEASUREMENTS', 'Customer has no saved measurements');
      m = rec as unknown as typeof m;
    }
    const clean: Measurements = {};
    for (const k of ['height', 'bust', 'waist', 'hips', 'shoulder', 'armLength'] as const) if (typeof m[k] === 'number') clean[k] = m[k] as number;

    const def: SizeChartDef = {
      weights: chart.weights as SizeChartDef['weights'],
      rows: chart.rows as unknown as SizeChartDef['rows'],
      lengthRows: chart.lengthRows as unknown as SizeChartDef['lengthRows'],
      heelAllowanceCm: chart.heelAllowanceCm,
    };
    const result = recommendSize(def, clean, m.fitPreference ?? 'REGULAR', m.wearsHeels ?? false);
    await this.prisma.sizeRecommendation.create({
      data: { tenantId, sizeChartId: chart.id, productId: b.productId ?? null, customerId: b.customerId ?? null, input: { ...clean, fit: m.fitPreference ?? 'REGULAR', heels: m.wearsHeels ?? false }, result: result as unknown as Prisma.InputJsonValue },
    });
    return { chart: { id: chart.id, name: chart.name }, ...result };
  }
}
