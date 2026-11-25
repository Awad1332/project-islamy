import { Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { automationSchema, campaignSchema, segmentRuleSchema, segmentSchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody } from '../../common/zod';
import { MarketingService } from './marketing.service';

const launchSchema = z.object({ scheduleAt: z.coerce.date().optional().nullable() });

@ApiTags('marketing')
@Controller('marketing')
export class MarketingController {
  constructor(private readonly svc: MarketingService) {}

  @RequirePermission('marketing:read') @Get('segments')
  segments(@CurrentUser() u: AuthUser) { return this.svc.segments(u); }
  @RequirePermission('marketing:read') @HttpCode(200) @Post('segments/preview')
  preview(@CurrentUser() u: AuthUser, @ZBody(segmentRuleSchema) b: z.infer<typeof segmentRuleSchema>) { return this.svc.previewSegment(u, b); }
  @RequirePermission('marketing:write') @Post('segments')
  createSegment(@CurrentUser() u: AuthUser, @ZBody(segmentSchema) b: z.infer<typeof segmentSchema>) { return this.svc.createSegment(u, b); }
  @RequirePermission('marketing:write') @Put('segments/:id')
  updateSegment(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(segmentSchema) b: z.infer<typeof segmentSchema>) { return this.svc.updateSegment(u, id, b); }
  @RequirePermission('marketing:write') @Delete('segments/:id')
  deleteSegment(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.deleteSegment(u, id); }

  @RequirePermission('marketing:read') @Get('campaigns')
  campaigns(@CurrentUser() u: AuthUser) { return this.svc.campaigns(u); }
  @RequirePermission('marketing:write') @Post('campaigns')
  createCampaign(@CurrentUser() u: AuthUser, @ZBody(campaignSchema) b: z.infer<typeof campaignSchema>) { return this.svc.createCampaign(u, b); }
  @RequirePermission('marketing:write') @Put('campaigns/:id')
  updateCampaign(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(campaignSchema) b: z.infer<typeof campaignSchema>) { return this.svc.updateCampaign(u, id, b); }
  @RequirePermission('marketing:write') @Delete('campaigns/:id')
  deleteCampaign(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.deleteCampaign(u, id); }
  @RequirePermission('marketing:write') @HttpCode(200) @Post('campaigns/:id/launch')
  launch(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(launchSchema) b: z.infer<typeof launchSchema>) { return this.svc.launchCampaign(u, id, b.scheduleAt); }
  @RequirePermission('marketing:write') @HttpCode(200) @Post('campaigns/:id/cancel')
  cancel(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.cancelCampaign(u, id); }

  @RequirePermission('marketing:read') @Get('automations')
  automations(@CurrentUser() u: AuthUser) { return this.svc.automations(u); }
  @RequirePermission('marketing:write') @Post('automations')
  createAutomation(@CurrentUser() u: AuthUser, @ZBody(automationSchema) b: z.infer<typeof automationSchema>) { return this.svc.createAutomation(u, b); }
  @RequirePermission('marketing:write') @Put('automations/:id')
  updateAutomation(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(automationSchema) b: z.infer<typeof automationSchema>) { return this.svc.updateAutomation(u, id, b); }
  @RequirePermission('marketing:write') @Delete('automations/:id')
  deleteAutomation(@CurrentUser() u: AuthUser, @Param('id') id: string) { return this.svc.deleteAutomation(u, id); }
}
