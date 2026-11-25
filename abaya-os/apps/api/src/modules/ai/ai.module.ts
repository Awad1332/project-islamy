import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiContentService } from './ai-content.service';
import { AiImagesService } from './ai-images.service';

@Module({ controllers: [AiController], providers: [AiContentService, AiImagesService] })
export class AiModule {}
