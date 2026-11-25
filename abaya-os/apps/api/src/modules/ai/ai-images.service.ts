import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { z } from 'zod';
import { imageJobSchema, paginationSchema } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { AuditService } from '../../common/audit.service';
import { integrationNotConnected, notFound } from '../../common/errors';
import { paged } from '../../common/zod';
import type { AuthUser } from '../../common/auth';
import { IntegrationsService } from '../integrations/integrations.service';
import { StorageService } from '../media/storage.service';
import { IMAGE_ADAPTERS } from './image-providers';

@Injectable()
export class AiImagesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiImagesService.name);
  private queue?: Queue;
  private worker?: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly integrations: IntegrationsService,
    private readonly storage: StorageService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    const connection = this.redis.connectionOptions();
    this.queue = new Queue('image-jobs', { connection });
    this.worker = new Worker('image-jobs', (job) => this.process(job.data.jobId), { connection, concurrency: 2 });
    this.worker.on('error', (e) => this.logger.error(e.message));
  }
  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }

  async status(u: AuthUser) {
    const creds = await this.integrations.verifiedCredentials(u.tenantId, 'IMAGE_GENERATION');
    return { available: Boolean(creds) && IMAGE_ADAPTERS.length > 0, adapters: IMAGE_ADAPTERS.map((a) => a.name), storageConfigured: this.storage.isConfigured() };
  }

  async create(u: AuthUser, b: z.infer<typeof imageJobSchema>) {
    const creds = await this.integrations.verifiedCredentials(u.tenantId, 'IMAGE_GENERATION');
    const adapter = IMAGE_ADAPTERS.find((a) => a.supports(b.type));
    if (!creds || !adapter) throw integrationNotConnected('IMAGE_GENERATION');
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: b.sourceAssetId, tenantId: u.tenantId } });
    if (!asset) throw notFound('source image');
    if (b.productId && !(await this.prisma.product.count({ where: { id: b.productId, tenantId: u.tenantId } }))) throw notFound('product');
    const job = await this.prisma.imageJob.create({ data: { tenantId: u.tenantId, userId: u.userId, productId: b.productId ?? null, type: b.type, sourceAssetId: asset.id, prompt: b.prompt, provider: adapter.name } });
    await this.queue?.add('run', { jobId: job.id }, { attempts: 2, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100 });
    await this.audit.log(u, 'ai_image.queued', 'ImageJob', job.id, { type: b.type });
    return job;
  }

  private async process(jobId: string) {
    const job = await this.prisma.imageJob.findUnique({ where: { id: jobId } });
    if (!job) return;
    await this.prisma.imageJob.update({ where: { id: jobId }, data: { status: 'PROCESSING' } });
    try {
      const creds = await this.integrations.verifiedCredentials(job.tenantId, 'IMAGE_GENERATION');
      const adapter = IMAGE_ADAPTERS.find((a) => a.name === job.provider);
      if (!creds || !adapter) throw new Error('IMAGE_PROVIDER_NOT_CONNECTED');
      const src = await this.prisma.mediaAsset.findUniqueOrThrow({ where: { id: job.sourceAssetId } });
      const res = await fetch(src.url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`SOURCE_FETCH_${res.status}`);
      const out = await adapter.run({ type: job.type, source: Buffer.from(await res.arrayBuffer()), sourceContentType: src.contentType, prompt: job.prompt, credentials: creds });
      const stored = await this.storage.putImage(job.tenantId, out);
      const asset = await this.prisma.mediaAsset.create({ data: { tenantId: job.tenantId, key: stored.key, url: stored.url, contentType: stored.contentType, sizeBytes: out.length, uploadedBy: job.userId } });
      await this.prisma.imageJob.update({ where: { id: jobId }, data: { status: 'SUCCEEDED', resultAssetId: asset.id, error: null } });
    } catch (e) {
      await this.prisma.imageJob.update({ where: { id: jobId }, data: { status: 'FAILED', error: (e as Error).message.slice(0, 500) } });
      throw e;
    }
  }

  async list(u: AuthUser, q: z.infer<typeof paginationSchema>) {
    const where = { tenantId: u.tenantId };
    const [items, total] = await Promise.all([
      this.prisma.imageJob.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      this.prisma.imageJob.count({ where }),
    ]);
    return paged(items, total, q.page, q.pageSize);
  }
}
