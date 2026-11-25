import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i, 'ENCRYPTION_KEY must be 64 hex chars'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  S3_ENDPOINT: z.string().optional().default(''),
  S3_REGION: z.string().default('me-central-1'),
  S3_BUCKET: z.string().optional().default(''),
  S3_ACCESS_KEY_ID: z.string().optional().default(''),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(''),
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  S3_PUBLIC_URL: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-opus-5-5'),
});
export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;
export function env(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`Invalid environment configuration:\n${msg}`);
    }
    if (parsed.data.NODE_ENV === 'production' && /^0+$/.test(parsed.data.ENCRYPTION_KEY))
      throw new Error('ENCRYPTION_KEY must not be the placeholder value in production');
    cached = parsed.data;
  }
  return cached;
}
export function resetEnvCache() {
  cached = null;
}
