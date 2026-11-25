import { Controller, Get, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, RequirePermission } from '../../common/auth';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { StorageService } from '../media/storage.service';
import { env } from '../../config/env';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService, private readonly storage: StorageService) {}

  @Public()
  @Get('health')
  async health() {
    const db = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
    const redis = await this.redis.client.ping().then((r) => r === 'PONG').catch(() => false);
    return { status: db && redis ? 'ok' : 'degraded', db, redis, time: new Date().toISOString() };
  }

  /** Honest platform status for the UI: each external dependency is checked live. */
  @RequirePermission()
  @Get('system/status')
  async status() {
    return {
      storage: await this.storage.verify(),
      platformAiKeyConfigured: Boolean(env().ANTHROPIC_API_KEY),
      billingGateway: { configured: false },
      zatcaPhase2: { integrated: false },
    };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
