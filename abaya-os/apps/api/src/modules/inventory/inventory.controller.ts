import { Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { adjustStockSchema, locationSchema, paginationSchema, transferStockSchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody, ZQuery } from '../../common/zod';
import { InventoryService, inventoryQuerySchema } from './inventory.service';

@ApiTags('inventory')
@Controller()
export class InventoryController {
  constructor(private readonly inv: InventoryService) {}

  @RequirePermission('inventory:read')
  @Get('locations')
  locations(@CurrentUser() u: AuthUser) {
    return this.inv.locations(u);
  }
  @RequirePermission('inventory:write')
  @Post('locations')
  createLocation(@CurrentUser() u: AuthUser, @ZBody(locationSchema) b: z.infer<typeof locationSchema>) {
    return this.inv.createLocation(u, b);
  }
  @RequirePermission('inventory:write')
  @Put('locations/:id')
  updateLocation(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(locationSchema) b: z.infer<typeof locationSchema>) {
    return this.inv.updateLocation(u, id, b);
  }
  @RequirePermission('inventory:write')
  @Delete('locations/:id')
  deleteLocation(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.inv.deleteLocation(u, id);
  }

  @RequirePermission('inventory:read')
  @Get('inventory')
  list(@CurrentUser() u: AuthUser, @ZQuery(inventoryQuerySchema) q: z.infer<typeof inventoryQuerySchema>) {
    return this.inv.list(u, q);
  }
  @RequirePermission('inventory:write')
  @Post('inventory/adjust')
  adjust(@CurrentUser() u: AuthUser, @ZBody(adjustStockSchema) b: z.infer<typeof adjustStockSchema>) {
    return this.inv.adjust(u, b);
  }
  @RequirePermission('inventory:write')
  @Post('inventory/transfer')
  transfer(@CurrentUser() u: AuthUser, @ZBody(transferStockSchema) b: z.infer<typeof transferStockSchema>) {
    return this.inv.transfer(u, b);
  }
  @RequirePermission('inventory:read')
  @Get('inventory/movements')
  movements(@CurrentUser() u: AuthUser, @ZQuery(paginationSchema) q: z.infer<typeof paginationSchema>, @Query('variantId') variantId?: string) {
    return this.inv.movements(u, variantId, q.page, q.pageSize);
  }
}
