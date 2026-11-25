import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { changePlanSchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody } from '../../common/zod';
import { BillingService } from './billing.service';

const cancelSchema = z.object({ cancel: z.boolean() });

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @RequirePermission()
  @Get('plans')
  plans() {
    return this.billing.plans();
  }

  @RequirePermission('billing:manage')
  @Get()
  overview(@CurrentUser() u: AuthUser) {
    return this.billing.overview(u);
  }

  @RequirePermission('billing:manage')
  @HttpCode(200)
  @Post('change-plan')
  change(@CurrentUser() u: AuthUser, @ZBody(changePlanSchema) b: z.infer<typeof changePlanSchema>) {
    return this.billing.requestPlanChange(u, b.planCode);
  }

  @RequirePermission('billing:manage')
  @HttpCode(200)
  @Post('cancel')
  cancel(@CurrentUser() u: AuthUser, @ZBody(cancelSchema) b: z.infer<typeof cancelSchema>) {
    return this.billing.cancelAtPeriodEnd(u, b.cancel);
  }
}
