import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, UnauthorizedException, HttpCode, Query } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Blog } from './blogs.entity';
import { CreateBlogDto } from './dtos/create-blog.dto';
import { UpdateBlogDto } from './dtos/update-blog.dto';
import { QueryBlogDto } from './dtos/query-blog.dto';
import { Request } from 'express';
import { User } from '../users/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) { }

  @Get()
  async getAllBlogs(@Query() query: QueryBlogDto): Promise<{
    data: Blog[];
    meta: { total: number; page: number; pages: number; limit: number }
  }> {
    const { blogs, total, pages } = await this.blogsService.findAll(query);

    return {
      data: blogs,
      meta: {
        total,
        page: query.page || 1,
        pages,
        limit: query.limit || 10
      }
    };
  }

  @Get(':slug')
  async getBlog(@Param('slug') slug: string): Promise<Blog> {
    return this.blogsService.findBySlug(slug);
  }

  @Post()
  @Roles('Admin', 'Editor')
  @UseGuards(AuthGuard, RoleGuard)
  async createBlog(@Body() blogData: CreateBlogDto, @Req() req: RequestWithUser): Promise<Blog> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User ID is required');
    }
    return this.blogsService.create({ ...blogData, userId: req.user.id });
  }

  @Put(':id')
  @Roles('Admin', 'Editor')
  @UseGuards(AuthGuard, RoleGuard)
  async updateBlog(
    @Param('id') id: string,
    @Body() updateData: UpdateBlogDto,
    @Req() req: RequestWithUser
  ): Promise<Blog> {
    const blog = await this.blogsService.findOne(id);
    updateData.editedBy = req.user;
    return this.blogsService.update(id, updateData);
  }

  @Delete(':id')
  @Roles('Admin')
  @UseGuards(AuthGuard, RoleGuard)
  @HttpCode(204)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.blogsService.remove(id);
  }
}
