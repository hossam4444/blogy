import { Module } from '@nestjs/common';
import { ApiFeaturesService } from './services/api-features.service';
import { ResponseBuilderService } from './services/response-builder.service';

@Module({
  providers: [ApiFeaturesService, ResponseBuilderService],
  exports: [ApiFeaturesService, ResponseBuilderService],
})
export class CommonModule { }
