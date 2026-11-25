import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { inviteSchema, paginationSchema, tenantSettingsSchema, updateMemberSchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody, ZQuery } from '../../common/zod';
import { StoreService } from './store.service';

@ApiTags('store')
@Controller()
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @RequirePermission('settings:read')
  @Get('settings')
  settings(@CurrentUser() u: AuthUser) {
    return this.store.getSettings(u);
  }

  @RequirePermission('settings:write')
  @Put('settings')
  update(@CurrentUser() u: AuthUser, @ZBody(tenantSettingsSchema) body: z.infer<typeof tenantSettingsSchema>) {
    return this.store.updateSettings(u, body);
  }

  @RequirePermission('team:manage')
  @Get('team')
  team(@CurrentUser() u: AuthUser) {
    return this.store.listTeam(u);
  }

  @RequirePermission('team:manage')
  @Post('team/invitations')
  invite(@CurrentUser() u: AuthUser, @ZBody(inviteSchema) body: z.infer<typeof inviteSchema>) {
    return this.store.invite(u, body);
  }

  @RequirePermission('team:manage')
  @Delete('team/invitations/:id')
  revoke(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.store.revokeInvite(u, id);
  }

  @RequirePermission('team:manage')
  @Patch('team/members/:id')
  updateMember(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(updateMemberSchema) body: z.infer<typeof updateMemberSchema>) {
    return this.store.updateMember(u, id, body.role);
  }

  @RequirePermission('team:manage')
  @Delete('team/members/:id')
  removeMember(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.store.removeMember(u, id);
  }

  @RequirePermission('audit:read')
  @Get('audit-log')
  audit(@CurrentUser() u: AuthUser, @ZQuery(paginationSchema) q: z.infer<typeof paginationSchema>) {
    return this.store.auditLog(u, q.page, q.pageSize);
  }

  @RequirePermission()
  @Get('onboarding')
  onboarding(@CurrentUser() u: AuthUser) {
    return this.store.onboarding(u);
  }

  @RequirePermission('settings:write')
  @Post('onboarding/dismiss')
  dismiss(@CurrentUser() u: AuthUser, @Body() body: { dismissed?: boolean }) {
    return this.store.dismissOnboarding(u, body?.dismissed !== false);
  }
}
