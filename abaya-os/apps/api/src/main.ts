import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp, setupSwagger } from './bootstrap';
import { env } from './config/env';

async function bootstrap() {
  const cfg = env(); // fail fast on invalid configuration
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  configureApp(app);
  setupSwagger(app);
  app.enableShutdownHooks();
  await app.listen(cfg.PORT);
  Logger.log(`ABAYA OS API listening on :${cfg.PORT} (docs at /api/docs)`, 'Bootstrap');
}
bootstrap();
