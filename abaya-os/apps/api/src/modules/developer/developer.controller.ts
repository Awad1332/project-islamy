import { Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { apiKeySchema, createOrderSchema, orderQuerySchema, productQuerySchema, customerQuerySchema, webhookSchema, type CreateOrderInput } from '@abaya/shared';
import { ApiKeyAuth, CurrentApiKey, CurrentUser, RequirePermission, type ApiKeyPrincipal, type AuthUser } from '../../common/auth';
import { ZBody, ZQuery } from '../../common/zod';
import { DeveloperService } from './developer.service';
import { CatalogService } from '../catalog/catalog.service';
import { OrdersService } from '../orders/orders.service';
import { CustomersService } from '../customers/customers.service';

@ApiTags('developer')
@Controller('developer')
export class DeveloperController {
  constructor(private readonly svc: DeveloperService) {}

  @RequirePermission('developer:manage') @Get('api-keys')
  keys(@CurrentUser() u: AuthUser) { return this.svc.apiKeys(u); }
  @RequirePermission('developer:manage') @Post('api-keys')
  createKey(@CurrentUser() u: AuthUser, @ZBody(apiKeySchema) b: z.infer<typeof apiKeySchema>) { return this.svc.createApiKey(u, b); }
  @RequirePermission('developer:manage') @Delete('api-keys/:id')
  revokeKey(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.revokeApiKey(u, id); }

  @RequirePermission('developer:manage') @Get('webhooks')
  webhooks(@CurrentUser() u: AuthUser) { return this.svc.webhooks(u); }
  @RequirePermission('developer:manage') @Post('webhooks')
  createWebhook(@CurrentUser() u: AuthUser, @ZBody(webhookSchema) b: z.infer<typeof webhookSchema>) { return this.svc.createWebhook(u, b); }
  @RequirePermission('developer:manage') @Put('webhooks/:id')
  updateWebhook(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(webhookSchema) b: z.infer<typeof webhookSchema>) { return this.svc.updateWebhook(u, id, b); }
  @RequirePermission('developer:manage') @Delete('webhooks/:id')
  deleteWebhook(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.deleteWebhook(u, id); }
  @RequirePermission('developer:manage') @Get('webhooks/:id/deliveries')
  deliveries(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.deliveries(u, id); }
  @RequirePermission('developer:manage') @HttpCode(200) @Post('webhooks/:id/test')
  test(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.test(u, id); }
}

/** Integration-ready public REST API, authenticated with tenant API keys (x-api-key). */
@ApiTags('public-v1')
@Controller('public/v1')
export class PublicApiController {
  constructor(private readonly catalog: CatalogService, private readonly orders: OrdersService, private readonly customers: CustomersService) {}

  private principal(k: ApiKeyPrincipal): AuthUser {
    return { tenantId: k.tenantId, userId: `apikey:${k.apiKeyId}`, role: 'STAFF', isPlatformAdmin: false, email: '' };
  }

  @ApiKeyAuth('products:read') @Get('products')
  products(@CurrentApiKey() k: ApiKeyPrincipal, @ZQuery(productQuerySchema) q: z.infer<typeof productQuerySchema>) { return this.catalog.list(this.principal(k), q); }
  @ApiKeyAuth('products:read') @Get('products/:id')
  product(@CurrentApiKey() k: ApiKeyPrincipal, @Param('id') id: string) { return this.catalog.get(this.principal(k), id); }
  @ApiKeyAuth('orders:read') @Get('orders')
  listOrders(@CurrentApiKey() k: ApiKeyPrincipal, @ZQuery(orderQuerySchema) q: z.infer<typeof orderQuerySchema>) { return this.orders.list(this.principal(k), q); }
  @ApiKeyAuth('orders:read') @Get('orders/:id')
  order(@CurrentApiKey() k: ApiKeyPrincipal, @Param('id') id: string) { return this.orders.get(this.principal(k), id); }
  @ApiKeyAuth('orders:write') @Post('orders')
  createOrder(@CurrentApiKey() k: ApiKeyPrincipal, @ZBody(createOrderSchema) b: CreateOrderInput) {
    return this.orders.create({ ...this.principal(k), userId: undefined as unknown as string }, { ...b, channel: b.channel ?? 'ONLINE_STORE' });
  }
  @ApiKeyAuth('customers:read') @Get('customers')
  listCustomers(@CurrentApiKey() k: ApiKeyPrincipal, @ZQuery(customerQuerySchema) q: z.infer<typeof customerQuerySchema>) { return this.customers.list(this.principal(k), q); }
}
