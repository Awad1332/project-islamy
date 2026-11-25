import { Module } from '@nestjs/common';
import { DeveloperController, PublicApiController } from './developer.controller';
import { DeveloperService } from './developer.service';
import { CatalogModule } from '../catalog/catalog.module';
import { CustomersModule } from '../customers/customers.module';

@Module({ imports: [CatalogModule, CustomersModule], controllers: [DeveloperController, PublicApiController], providers: [DeveloperService] })
export class DeveloperModule {}
