import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';

import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { Blog } from './blogs.entity';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Blog]),
    AuthModule,
  ],
  providers: [BlogsService, AuthGuard, RoleGuard],
  controllers: [BlogsController],
})
export class BlogsModule { }
