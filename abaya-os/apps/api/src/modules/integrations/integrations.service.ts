import { Injectable } from '@nestjs/common';
import type { IntegrationProvider, Prisma } from '@prisma/client';
import { z } from 'zod';
import { integrationConfigSchema } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { AuditService } from '../../common/audit.service';
import { AppError, notFound } from '../../common/errors';
import type { AuthUser } from '../../common/auth';
import { PROVIDERS } from './providers';

function mask(v: string) {
  return v.length <= 6 ? '••••' : `${v.slice(0, 3)}••••${v.slice(-3)}`;
}

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService, private readonly crypto: CryptoService, private readonly audit: AuditService) {}

  async list(u: AuthUser) {
    const rows = await this.prisma.integration.findMany({ where: { tenantId: u.tenantId } });
    const byProvider = new Map(rows.map((r) => [r.provider, r]));
    return Object.values(PROVIDERS).map((def) => {
      const row = byProvider.get(def.provider);
      let masked: Record<string, string> = {};
      if (row?.credentialsEnc) {
        const creds = JSON.parse(this.crypto.decrypt(row.credentialsEnc)) as Record<string, string>;
        masked = Object.fromEntries(def.fields.filter((f) => creds[f.key]).map((f) => [f.key, f.secret ? mask(creds[f.key]) : creds[f.key]]));
      }
      return {
        provider: def.provider,
        category: def.category,
        fields: def.fields,
        verificationSupported: def.verify !== null,
        capabilities: def.capabilities,
        docs: def.docs,
        status: row?.status ?? 'NOT_CONFIGURED',
        connected: row?.status === 'VERIFIED',
        lastVerifiedAt: row?.lastVerifiedAt ?? null,
        lastError: row?.lastError ?? null,
        settings: row?.settings ?? {},
        maskedCredentials: masked,
      };
    });
  }

  async configure(u: AuthUser, b: z.infer<typeof integrationConfigSchema>) {
    const def = PROVIDERS[b.provider];
    const existing = await this.prisma.integration.findUnique({ where: { tenantId_provider: { tenantId: u.tenantId, provider: b.provider } } });
    const previous = existing?.credentialsEnc ? (JSON.parse(this.crypto.decrypt(existing.credentialsEnc)) as Record<string, string>) : {};
    const creds: Record<string, string> = {};
    for (const f of def.fields) {
      const v = b.credentials[f.key]?.trim();
      // Empty secret field on update keeps the stored value (UI never receives secrets).
      const value = v || previous[f.key] || '';
      if (f.required && !value) throw new AppError(422, 'CREDENTIAL_REQUIRED', `${f.key} is required`, { field: f.key });
      if (value) creds[f.key] = value;
    }
    const row = await this.prisma.integration.upsert({
      where: { tenantId_provider: { tenantId: u.tenantId, provider: b.provider } },
      create: { tenantId: u.tenantId, provider: b.provider, status: 'CONFIGURED', credentialsEnc: this.crypto.encrypt(JSON.stringify(creds)), settings: b.settings as Prisma.InputJsonValue },
      // Any credential change invalidates prior verification.
      update: { status: 'CONFIGURED', credentialsEnc: this.crypto.encrypt(JSON.stringify(creds)), settings: b.settings as Prisma.InputJsonValue, lastError: null, lastVerifiedAt: null },
    });
    await this.audit.log(u, 'integration.configured', 'Integration', row.id, { provider: b.provider });
    return { provider: row.provider, status: row.status };
  }

  async verify(u: AuthUser, provider: IntegrationProvider) {
    const def = PROVIDERS[provider];
    const row = await this.prisma.integration.findUnique({ where: { tenantId_provider: { tenantId: u.tenantId, provider } } });
    if (!row?.credentialsEnc) throw notFound('integration credentials');
    if (!def.verify) {
      return { provider, status: row.status, verified: false, reason: 'VERIFICATION_NOT_IMPLEMENTED' };
    }
    const creds = JSON.parse(this.crypto.decrypt(row.credentialsEnc)) as Record<string, string>;
    const result = await def.verify(creds);
    const updated = await this.prisma.integration.update({
      where: { id: row.id },
      data: result.ok
        ? { status: 'VERIFIED', lastVerifiedAt: new Date(), lastError: null }
        : { status: 'FAILED', lastError: (result.detail ?? 'verification failed').slice(0, 500) },
    });
    await this.audit.log(u, result.ok ? 'integration.verified' : 'integration.verify_failed', 'Integration', row.id, { provider, detail: result.detail });
    return { provider, status: updated.status, verified: result.ok, reason: result.detail ?? null };
  }

  async disconnect(u: AuthUser, provider: IntegrationProvider) {
    const r = await this.prisma.integration.deleteMany({ where: { tenantId: u.tenantId, provider } });
    if (!r.count) throw notFound('integration');
    await this.audit.log(u, 'integration.disconnected', 'Integration', null, { provider });
    return { ok: true };
  }

  /** Returns decrypted credentials only for VERIFIED integrations. */
  async verifiedCredentials(tenantId: string, provider: IntegrationProvider): Promise<Record<string, string> | null> {
    const row = await this.prisma.integration.findUnique({ where: { tenantId_provider: { tenantId, provider } } });
    if (!row || row.status !== 'VERIFIED' || !row.credentialsEnc) return null;
    return JSON.parse(this.crypto.decrypt(row.credentialsEnc));
  }
}
