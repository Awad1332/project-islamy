import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { AuthGuard } from './common/auth';
import { AllExceptionsFilter } from './common/errors';
import { AuthModule } from './modules/auth/auth.module';
import { StoreModule } from './modules/store/store.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { MediaModule } from './modules/media/media.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { SizingModule } from './modules/sizing/sizing.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { MessagingModule } from './modules/messaging/sender.service';
import { AiModule } from './modules/ai/ai.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DeveloperModule } from './modules/developer/developer.module';
import { HealthModule } from './modules/health/health.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: process.env.NODE_ENV === 'test' ? 10_000 : 300 }]),
    ScheduleModule.forRoot(),
    CommonModule, BillingModule, MediaModule, IntegrationsModule, MessagingModule, InventoryModule, OrdersModule,
    AuthModule, StoreModule, AdminModule, CatalogModule, CustomersModule, ReturnsModule, SizingModule,
    AiModule, MarketingModule, InboxModule, AnalyticsModule, DeveloperModule, HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
