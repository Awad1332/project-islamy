import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './config/env';

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: env().CORS_ORIGINS.split(',').map((s) => s.trim()), credentials: true });
  (app as any).set?.('trust proxy', 1);
  return app;
}

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('ABAYA OS API')
    .setDescription('Multi-tenant commerce platform for Saudi abaya brands. Money values are integer halalas (SAR × 100); timestamps are UTC, analytics bucket by Asia/Riyadh.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'api-key')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc, { jsonDocumentUrl: 'api/docs-json' });
  return doc;
}
