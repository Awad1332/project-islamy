import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { aiGenerateSchema, imageJobSchema, paginationSchema } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody, ZQuery } from '../../common/zod';
import { AiContentService } from './ai-content.service';
import { AiImagesService } from './ai-images.service';

const applySchema = z.object({
  field: z.enum(['titleAr', 'titleEn', 'descriptionAr', 'descriptionEn', 'seo']),
  text: z.string().max(5000).optional(),
});

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly content: AiContentService, private readonly images: AiImagesService) {}

  @RequirePermission('ai:use')
  @Get('content/status')
  status(@CurrentUser() u: AuthUser) {
    return this.content.status(u);
  }
  @RequirePermission('ai:use')
  @Post('content/generate')
  generate(@CurrentUser() u: AuthUser, @ZBody(aiGenerateSchema) b: z.infer<typeof aiGenerateSchema>) {
    return this.content.generate(u, b);
  }
  @RequirePermission('ai:use')
  @Get('content/history')
  history(@CurrentUser() u: AuthUser, @ZQuery(paginationSchema) q: z.infer<typeof paginationSchema>, @Query('productId') productId?: string) {
    return this.content.history(u, q, productId);
  }
  @RequirePermission('catalog:write')
  @HttpCode(200)
  @Post('content/:id/apply')
  apply(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(applySchema) b: z.infer<typeof applySchema>) {
    return this.content.apply(u, id, b.field, b.text);
  }

  @RequirePermission('ai:use')
  @Get('images/status')
  imageStatus(@CurrentUser() u: AuthUser) {
    return this.images.status(u);
  }
  @RequirePermission('ai:use')
  @Get('images/jobs')
  imageJobs(@CurrentUser() u: AuthUser, @ZQuery(paginationSchema) q: z.infer<typeof paginationSchema>) {
    return this.images.list(u, q);
  }
  @RequirePermission('ai:use')
  @Post('images/jobs')
  createImageJob(@CurrentUser() u: AuthUser, @ZBody(imageJobSchema) b: z.infer<typeof imageJobSchema>) {
    return this.images.create(u, b);
  }
}
