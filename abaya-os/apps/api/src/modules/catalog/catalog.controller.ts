import { Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { PRODUCT_STATUSES, categorySchema, productQuerySchema, productSchema, type ProductInput } from '@abaya/shared';
import { CurrentUser, RequirePermission, type AuthUser } from '../../common/auth';
import { ZBody, ZQuery } from '../../common/zod';
import { CatalogService } from './catalog.service';

const statusSchema = z.object({ status: z.enum(PRODUCT_STATUSES) });
const imageSchema = z.object({ assetId: z.string().min(1), color: z.string().max(40).optional().nullable() });
const reorderSchema = z.object({ ids: z.array(z.string()).max(50) });

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @RequirePermission('catalog:read')
  @Get('categories')
  categories(@CurrentUser() u: AuthUser) {
    return this.catalog.categories(u);
  }
  @RequirePermission('catalog:write')
  @Post('categories')
  createCategory(@CurrentUser() u: AuthUser, @ZBody(categorySchema) b: z.infer<typeof categorySchema>) {
    return this.catalog.createCategory(u, b);
  }
  @RequirePermission('catalog:write')
  @Put('categories/:id')
  updateCategory(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(categorySchema) b: z.infer<typeof categorySchema>) {
    return this.catalog.updateCategory(u, id, b);
  }
  @RequirePermission('catalog:write')
  @Delete('categories/:id')
  deleteCategory(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.catalog.deleteCategory(u, id);
  }

  @RequirePermission('catalog:read')
  @Get('products')
  list(@CurrentUser() u: AuthUser, @ZQuery(productQuerySchema) q: z.infer<typeof productQuerySchema>) {
    return this.catalog.list(u, q);
  }
  @RequirePermission('catalog:read')
  @Get('variants/search')
  searchVariants(@CurrentUser() u: AuthUser, @Query('q') q?: string) {
    return this.catalog.searchVariants(u, (q ?? '').slice(0, 100));
  }
  @RequirePermission('catalog:read')
  @Get('products/:id')
  get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.catalog.get(u, id);
  }
  @RequirePermission('catalog:write')
  @Post('products')
  create(@CurrentUser() u: AuthUser, @ZBody(productSchema) b: ProductInput) {
    return this.catalog.create(u, b);
  }
  @RequirePermission('catalog:write')
  @Put('products/:id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(productSchema) b: ProductInput) {
    return this.catalog.update(u, id, b);
  }
  @RequirePermission('catalog:write')
  @Patch('products/:id/status')
  status(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(statusSchema) b: z.infer<typeof statusSchema>) {
    return this.catalog.setStatus(u, id, b.status);
  }
  @RequirePermission('catalog:write')
  @Post('products/:id/duplicate')
  duplicate(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.catalog.duplicate(u, id);
  }
  @RequirePermission('catalog:write')
  @Delete('products/:id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.catalog.remove(u, id);
  }
  @RequirePermission('catalog:write')
  @Post('products/:id/images')
  addImage(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(imageSchema) b: z.infer<typeof imageSchema>) {
    return this.catalog.addImage(u, id, b.assetId, b.color);
  }
  @RequirePermission('catalog:write')
  @Put('products/:id/images/order')
  reorder(@CurrentUser() u: AuthUser, @Param('id') id: string, @ZBody(reorderSchema) b: z.infer<typeof reorderSchema>) {
    return this.catalog.reorderImages(u, id, b.ids);
  }
  @RequirePermission('catalog:write')
  @Delete('products/:id/images/:imageId')
  removeImage(@CurrentUser() u: AuthUser, @Param('id') id: string, @Param('imageId') imageId: string) {
    return this.catalog.removeImage(u, id, imageId);
  }
}
