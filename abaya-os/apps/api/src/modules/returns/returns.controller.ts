import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { createReturnSchema, returnTransitionSchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody, ZQuery } from '../../common/zod';
import { ReturnsService, returnQuerySchema } from './returns.service';

@ApiTags('returns')
@Controller('returns')
export class ReturnsController {
  constructor(private readonly svc: ReturnsService) {}

  @RequirePermission('returns:read')
  @Get()
  list(@CurrentUser() u: AuthUser, @ZQuery(returnQuerySchema) q: z.infer<typeof returnQuerySchema>) {
    return this.svc.list(u, q);
  }
  @RequirePermission('returns:read')
  @Get(':id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.svc.get(u, id);
  }
  @RequirePermission('returns:write')
  @Post()
  create(@CurrentUser() u: AuthUser, @ZBody(createReturnSchema) b: z.infer<typeof createReturnSchema>) {
    return this.svc.create(u, b);
  }
  @RequirePermission('returns:write')
  @Post(':id/transition')
  transition(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(returnTransitionSchema) b: z.infer<typeof returnTransitionSchema>) {
    return this.svc.transition(u, id, b);
  }
}
