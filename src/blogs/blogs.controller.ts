import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Req, UnauthorizedException, HttpCode, ParseUUIDPipe, HttpStatus
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { AuthGuard } from '../guards/auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Blog } from './blogs.entity';
import { CreateBlogDto } from './dtos/create-blog.dto';
import { UpdateBlogDto } from './dtos/update-blog.dto';
import { QueryBlogDto } from './dtos/query-blog.dto';
import { Request } from 'express';
import { User } from '../users/user.entity';
import { ResponseBuilderService, ApiResponse } from '../common/services/response-builder.service';
import { BlogResponseDto, BlogListResponseDto } from '../common/dtos/api-response.dto';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiParam, ApiBody
} from '@nestjs/swagger';


interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly responseBuilder: ResponseBuilderService<any>,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all blogs with filtering, sorting, and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Sort order (e.g., -createdAt,title).', example: '-createdAt' })
  @ApiQuery({ name: 'fields', required: false, type: String, description: 'Fields to include (e.g., title,slug).', example: 'title,slug' })
  @ApiQuery({ name: 'q', required: false, type: String, description: "Global search term.", example: 'nestjs' })
  @ApiQuery({ name: 'tags', required: false, type: String, description: 'Filter by tags (comma-separated).', example: 'typeorm,api' })
  @ApiQuery({ name: '[fieldName]', required: false, description: 'Generic filter: `fieldName=[operator]value` (e.g. `title=[=]My Title`)' })
  @ApiQuery({ name: 'createdAt', required: false, type: String, description: 'Filter by creation date range (e.g., `[between]2024-12-31,2025-04-22`).', example: '[between]2024-12-31,2025-04-22' })
  @SwaggerApiResponse({ status: 200, description: 'Successfully retrieved blogs.', type: BlogListResponseDto })
  @SwaggerApiResponse({ status: 400, description: 'Bad Request' })
  async getAllBlogs(@Query() query: QueryBlogDto): Promise<ApiResponse<Blog[]>> {
    const { data, meta } = await this.blogsService.findAll(query);

    return this.responseBuilder
      .status(HttpStatus.OK)
      .messageText('Blogs retrieved successfully')
      .data(data)
      .pagination(meta)
      .build();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single blog by its slug' })
  @ApiParam({ name: 'slug', type: String })
  @SwaggerApiResponse({ status: 200, description: 'Successfully retrieved blog.', type: BlogResponseDto })
  @SwaggerApiResponse({ status: 404, description: 'Blog not found' })
  async getBlog(@Param('slug') slug: string): Promise<ApiResponse<Blog>> {
    const blog = await this.blogsService.findBySlug(slug);
    return this.responseBuilder
      .status(HttpStatus.OK)
      .messageText('Blog retrieved successfully')
      .data(blog)
      .pagination(null)
      .build();
  }

  @Post()
  @ApiBearerAuth()
  @Roles('Admin', 'Editor')
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Create a new blog (Admin/Editor only)' })
  @ApiBody({ type: CreateBlogDto })
  @SwaggerApiResponse({ status: 201, description: 'Blog created successfully.', type: BlogResponseDto })
  @SwaggerApiResponse({ status: 400, description: 'Bad Request' })
  async createBlog(@Body() blogData: CreateBlogDto, @Req() req: RequestWithUser): Promise<ApiResponse<Blog>> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User ID is required');
    }
    const newBlog = await this.blogsService.create({ ...blogData, userId: req.user.id });
    return this.responseBuilder
      .status(HttpStatus.CREATED)
      .messageText('Blog created successfully')
      .data(newBlog)
      .pagination(null)
      .build();
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles('Admin', 'Editor')
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Update a blog by ID (Admin/Editor only)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateBlogDto })
  @SwaggerApiResponse({ status: 200, description: 'Blog updated successfully.', type: BlogResponseDto })
  @SwaggerApiResponse({ status: 400, description: 'Bad Request' })
  async updateBlog(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateData: UpdateBlogDto,
    @Req() req: RequestWithUser
  ): Promise<ApiResponse<Blog>> {
    const updatePayload = { ...updateData, editedBy: req.user };
    const updatedBlog = await this.blogsService.update(id, updatePayload);
    return this.responseBuilder
      .status(HttpStatus.OK)
      .messageText('Blog updated successfully')
      .data(updatedBlog)
      .pagination(null)
      .build();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @Roles('Admin')
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Delete a blog by ID (Admin only)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerApiResponse({ status: 204, description: 'Blog deleted successfully (No Content).' })
  async deleteBlog(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.blogsService.remove(id);
  }
}