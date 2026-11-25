import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from '../config/env';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor() {
    this.client = new Redis(env().REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: false });
    this.client.on('error', (e) => this.logger.error(`Redis error: ${e.message}`));
  }

  /** Separate connection settings for BullMQ. */
  connectionOptions() {
    const u = new URL(env().REDIS_URL);
    return {
      host: u.hostname,
      port: Number(u.port || 6379),
      password: u.password || undefined,
      username: u.username || undefined,
      db: u.pathname && u.pathname !== '/' ? Number(u.pathname.slice(1)) : 0,
      maxRetriesPerRequest: null,
    };
  }

  async cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    try {
      const hit = await this.client.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      /* cache is best-effort */
    }
    const value = await fn();
    this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds).catch(() => undefined);
    return value;
  }

  async invalidatePrefix(prefix: string) {
    const stream = this.client.scanStream({ match: `${prefix}*`, count: 100 });
    for await (const keys of stream as AsyncIterable<string[]>) if (keys.length) await this.client.del(...keys);
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }
}
