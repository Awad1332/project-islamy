import { Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { customerNoteSchema, customerQuerySchema, customerSchema, measurementSchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody, ZQuery } from '../../common/zod';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly svc: CustomersService) {}

  @RequirePermission('customers:read')
  @Get()
  list(@CurrentUser() u: AuthUser, @ZQuery(customerQuerySchema) q: z.infer<typeof customerQuerySchema>) {
    return this.svc.list(u, q);
  }
  @RequirePermission('customers:read')
  @Get('tags')
  tags(@CurrentUser() u: AuthUser) {
    return this.svc.tags(u);
  }
  @RequirePermission('customers:read')
  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.get(u, id);
  }
  @RequirePermission('customers:write')
  @Post()
  create(@CurrentUser() u: AuthUser, @ZBody(customerSchema) b: z.infer<typeof customerSchema>) {
    return this.svc.create(u, b);
  }
  @RequirePermission('customers:write')
  @Put(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(customerSchema) b: z.infer<typeof customerSchema>) {
    return this.svc.update(u, id, b);
  }
  @RequirePermission('customers:write')
  @Delete(':id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.remove(u, id);
  }
  @RequirePermission('customers:write')
  @Post(':id/notes')
  note(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(customerNoteSchema) b: z.infer<typeof customerNoteSchema>) {
    return this.svc.addNote(u, id, b.body);
  }
  @RequirePermission('customers:write')
  @Post(':id/measurements')
  addMeasurement(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(measurementSchema) b: z.infer<typeof measurementSchema>) {
    return this.svc.upsertMeasurement(u, id, b);
  }
  @RequirePermission('customers:write')
  @Put(':id/measurements/:mid')
  updateMeasurement(@CurrentUser() u: AuthUser, @Param('id') id: string, @Param('mid') mid: string, @ZBody(measurementSchema) b: z.infer<typeof measurementSchema>) {
    return this.svc.upsertMeasurement(u, id, b, mid);
  }
  @RequirePermission('customers:write')
  @Delete(':id/measurements/:mid')
  deleteMeasurement(@CurrentUser() u: AuthUser, @Param('id') id: string, @Param('mid') mid: string) {
    return this.svc.deleteMeasurement(u, id, mid);
  }
}
