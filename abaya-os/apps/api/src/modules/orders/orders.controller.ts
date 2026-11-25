import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { createOrderSchema, orderPaymentSchema, orderQuerySchema, orderStatusSchema, type CreateOrderInput } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody, ZQuery } from '../../common/zod';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @RequirePermission('orders:read')
  @Get()
  list(@CurrentUser() u: AuthUser, @ZQuery(orderQuerySchema) q: z.infer<typeof orderQuerySchema>) {
    return this.svc.list(u, q);
  }
  @RequirePermission('orders:read')
  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.get(u, id);
  }
  @RequirePermission('orders:read')
  @Get(':id/invoice')
  invoice(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.invoice(u, id);
  }
  @RequirePermission('orders:write')
  @Post()
  create(@CurrentUser() u: AuthUser, @ZBody(createOrderSchema) b: CreateOrderInput) {
    return this.svc.create(u, b);
  }
  @RequirePermission('orders:write')
  @Patch(':id/status')
  status(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(orderStatusSchema) b: z.infer<typeof orderStatusSchema>) {
    return this.svc.updateStatus(u, id, b);
  }
  @RequirePermission('orders:write')
  @Post(':id/payments')
  pay(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(orderPaymentSchema) b: z.infer<typeof orderPaymentSchema>) {
    return this.svc.recordPayment(u, id, b);
  }
}
