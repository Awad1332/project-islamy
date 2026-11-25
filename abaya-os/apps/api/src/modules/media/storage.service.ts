import { Injectable, Logger } from '@nestjs/common';
import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/errors';

const SIGNATURES: { type: string; ext: string; check: (b: Buffer) => boolean }[] = [
  { type: 'image/jpeg', ext: 'jpg', check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png', ext: 'png', check: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: 'image/webp', ext: 'webp', check: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;

  isConfigured(): boolean {
    const e = env();
    return Boolean(e.S3_BUCKET && e.S3_ACCESS_KEY_ID && e.S3_SECRET_ACCESS_KEY);
  }

  private s3(): S3Client {
    if (!this.isConfigured()) throw new AppError(503, 'STORAGE_NOT_CONFIGURED', 'Object storage is not configured on this deployment');
    if (!this.client) {
      const e = env();
      this.client = new S3Client({
        region: e.S3_REGION,
        endpoint: e.S3_ENDPOINT || undefined,
        forcePathStyle: e.S3_FORCE_PATH_STYLE,
        credentials: { accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY },
      });
    }
    return this.client;
  }

  /** Live check against the bucket. */
  async verify(): Promise<{ configured: boolean; reachable: boolean; error?: string }> {
    if (!this.isConfigured()) return { configured: false, reachable: false };
    try {
      await this.s3().send(new HeadBucketCommand({ Bucket: env().S3_BUCKET }));
      return { configured: true, reachable: true };
    } catch (e) {
      return { configured: true, reachable: false, error: (e as Error).name || (e as Error).message };
    }
  }

  detect(buf: Buffer) {
    return SIGNATURES.find((s) => s.check(buf)) ?? null;
  }

  async putImage(tenantId: string, buf: Buffer) {
    if (buf.length > MAX_UPLOAD_BYTES) throw new AppError(413, 'FILE_TOO_LARGE', 'Max 10MB');
    const kind = this.detect(buf);
    if (!kind) throw new AppError(415, 'UNSUPPORTED_FILE', 'Only JPEG, PNG and WebP images are allowed');
    const now = new Date();
    const key = `tenants/${tenantId}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${kind.ext}`;
    try {
      await this.s3().send(new PutObjectCommand({ Bucket: env().S3_BUCKET, Key: key, Body: buf, ContentType: kind.type, CacheControl: 'public, max-age=31536000, immutable' }));
    } catch (e) {
      if (e instanceof AppError) throw e;
      this.logger.error(`S3 upload failed: ${(e as Error).message}`);
      throw new AppError(502, 'STORAGE_UPLOAD_FAILED', 'Upload to storage failed');
    }
    return { key, contentType: kind.type, url: this.publicUrl(key) };
  }

  async delete(key: string) {
    if (!this.isConfigured()) return;
    await this.s3().send(new DeleteObjectCommand({ Bucket: env().S3_BUCKET, Key: key })).catch((e) => this.logger.warn(`S3 delete failed: ${e.message}`));
  }

  publicUrl(key: string) {
    const e = env();
    const base = e.S3_PUBLIC_URL || `${e.S3_ENDPOINT.replace(/\/$/, '')}/${e.S3_BUCKET}`;
    return `${base.replace(/\/$/, '')}/${key}`;
  }
}
