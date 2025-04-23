import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { Blog } from './blogs.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Blog]),
    AuthModule,
    CommonModule,
  ],
  providers: [
    BlogsService,
  ],
  controllers: [BlogsController],
})
export class BlogsModule { }