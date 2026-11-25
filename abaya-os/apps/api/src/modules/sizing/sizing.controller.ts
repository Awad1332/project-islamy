import { Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { recommendSchema, sizeChartSchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody } from '../../common/zod';
import { SizingService } from './sizing.service';

@ApiTags('sizing')
@Controller('size-charts')
export class SizingController {
  constructor(private readonly svc: SizingService) {}

  @RequirePermission('catalog:read')
  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.svc.list(u);
  }
  @RequirePermission('catalog:read')
  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.get(u, id);
  }
  @RequirePermission('catalog:write')
  @Post()
  create(@CurrentUser() u: AuthUser, @ZBody(sizeChartSchema) b: z.infer<typeof sizeChartSchema>) {
    return this.svc.create(u, b);
  }
  @RequirePermission('catalog:write')
  @Put(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(sizeChartSchema) b: z.infer<typeof sizeChartSchema>) {
    return this.svc.update(u, id, b);
  }
  @RequirePermission('catalog:write')
  @Delete(':id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.remove(u, id);
  }
  @RequirePermission('catalog:read')
  @HttpCode(200)
  @Post('recommend')
  recommend(@CurrentUser() u: AuthUser, @ZBody(recommendSchema) b: z.infer<typeof recommendSchema>) {
    return this.svc.recommend(u.tenantId, b);
  }
}
