import { Controller, Delete, Get, HttpCode, Param, ParseEnumPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntegrationProvider } from '@prisma/client';
import { z } from 'zod';
import { integrationConfigSchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody } from '../../common/zod';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  @RequirePermission('integrations:manage')
  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.svc.list(u);
  }
  @RequirePermission('integrations:manage')
  @Put()
  configure(@CurrentUser() u: AuthUser, @ZBody(integrationConfigSchema) b: z.infer<typeof integrationConfigSchema>) {
    return this.svc.configure(u, b);
  }
  @RequirePermission('integrations:manage')
  @HttpCode(200)
  @Post(':provider/verify')
  verify(@CurrentUser() u: AuthUser, @Param('provider', new ParseEnumPipe(IntegrationProvider)) p: IntegrationProvider) {
    return this.svc.verify(u, p);
  }
  @RequirePermission('integrations:manage')
  @Delete(':provider')
  disconnect(@CurrentUser() u: AuthUser, @Param('provider', new ParseEnumPipe(IntegrationProvider)) p: IntegrationProvider) {
    return this.svc.disconnect(u, p);
  }
}
