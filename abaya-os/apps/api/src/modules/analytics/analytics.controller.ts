import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { analyticsQuerySchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZQuery } from '../../common/zod';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @RequirePermission('analytics:read')
  @Get('overview')
  overview(@CurrentUser() u: AuthUser, @ZQuery(analyticsQuerySchema) q: z.infer<typeof analyticsQuerySchema>) {
    return this.svc.overview(u, q.from, q.to);
  }

  @RequirePermission('orders:read')
  @Get('dashboard')
  dashboard(@CurrentUser() u: AuthUser) {
    return this.svc.dashboard(u);
  }
}
