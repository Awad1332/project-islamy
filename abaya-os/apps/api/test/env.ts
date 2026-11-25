process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://abaya:abaya@localhost:5432/abaya_os_test?schema=public';
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/15';
process.env.JWT_ACCESS_SECRET = 'test-secret-test-secret-test-secret-123456';
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
process.env.APP_URL = 'http://localhost:3000';
process.env.S3_BUCKET = '';
process.env.ANTHROPIC_API_KEY = '';
