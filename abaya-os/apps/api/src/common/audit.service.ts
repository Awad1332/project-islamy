import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import type { AuthUser } from './auth';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(user: Pick<AuthUser, 'tenantId' | 'userId'> | null, action: string, entityType: string, entityId?: string | null, metadata?: Record<string, unknown>) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: user?.tenantId ?? null,
        userId: user?.userId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
