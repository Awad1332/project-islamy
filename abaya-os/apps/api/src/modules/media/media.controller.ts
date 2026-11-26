import { Controller, Delete, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { paginationSchema } from '@abaya/shared';
import { CurrentUser, Public, RequirePermission, type AuthUser } from '../../common/auth';
import { PrismaService } from '../../common/prisma.service';
import { AppError, conflict, notFound } from '../../common/errors';
import { ZQuery, paged } from '../../common/zod';
import { MAX_UPLOAD_BYTES, StorageService } from './storage.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly storage: StorageService, private readonly prisma: PrismaService) {}

  @RequirePermission('catalog:read')
  @Get('status')
  status() {
    return this.storage.verify();
  }

  /** Public image delivery (product photos are public). Keys are random UUIDs under the tenant prefix. */
  @Public()
  @Get('files/*path')
  async file(@Req() req: Request, @Res() res: Response) {
    const raw = (req.params as Record<string, string | string[]>).path;
    const key = Array.isArray(raw) ? raw.join('/') : String(raw ?? '');
    if (!/^tenants\/[A-Za-z0-9_-]+\/[0-9]{4}\/[0-9]{2}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) throw notFound('file');
    const obj = await this.storage.getObject(key);
    if (!obj) throw notFound('file');
    res.setHeader('Content-Type', obj.contentType ?? 'application/octet-stream');
    if (obj.length) res.setHeader('Content-Length', String(obj.length));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    obj.body.pipe(res);
  }

  @RequirePermission('catalog:read')
  @Get()
  async list(@CurrentUser() u: AuthUser, @ZQuery(paginationSchema) q: z.infer<typeof paginationSchema>) {
    const where = { tenantId: u.tenantId };
    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    return paged(items, total, q.page, q.pageSize);
  }

  @RequirePermission('catalog:write')
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async upload(@CurrentUser() u: AuthUser, @UploadedFile() file?: { buffer: Buffer; size: number }) {
    if (!file) throw new AppError(400, 'FILE_REQUIRED');
    const stored = await this.storage.putImage(u.tenantId, file.buffer);
    return this.prisma.mediaAsset.create({
      data: { tenantId: u.tenantId, key: stored.key, url: stored.url, contentType: stored.contentType, sizeBytes: file.size, uploadedBy: u.userId },
    });
  }

  @RequirePermission('catalog:write')
  @Delete(':id')
  async remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!asset) throw notFound('media');
    const used = await this.prisma.productImage.count({ where: { assetId: id, tenantId: u.tenantId } });
    if (used) throw conflict('MEDIA_IN_USE', 'Image is attached to a product');
    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.storage.delete(asset.key);
    return { ok: true };
  }
}
