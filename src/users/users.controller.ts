import {
  Controller, Get, Param, NotFoundException, Delete, ParseUUIDPipe, Query, HttpCode, HttpStatus
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { QueryUserDto } from './dtos/query-user.dto';
import { ResponseBuilderService, ApiResponse } from '../common/services/response-builder.service';
import { UserResponseDto, UserListResponseDto } from '../common/dtos/user-response.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly responseBuilder: ResponseBuilderService<any>
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all users with filtering, sorting, and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sort', required: false, type: String, example: '-createdAt,lastName' })
  @ApiQuery({ name: 'fields', required: false, type: String, example: 'id,firstName,email,role' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search first/last name, email', example: 'john' })
  @ApiQuery({ name: 'role', required: false, enum: ['Admin', 'Editor'], example: 'Editor' })
  @ApiQuery({ name: 'email', required: false, type: String, example: 'test@example.com' })
  @ApiQuery({ name: 'createdAt', required: false, type: String, description: 'Filter by date, e.g. `[>=]2024-01-01`', example: '[>=]2024-01-01' })
  @SwaggerApiResponse({ status: 200, description: 'Successfully retrieved users.', type: UserListResponseDto })
  @SwaggerApiResponse({ status: 400, description: 'Bad Request' })
  async findAll(@Query() query: QueryUserDto): Promise<ApiResponse<User[]>> {
    const { data, meta } = await this.usersService.findAll(query);
    return this.responseBuilder
      .status(HttpStatus.OK)
      .messageText('Users retrieved successfully')
      .data(data)
      .pagination(meta)
      .build();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'User UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Successfully retrieved user.', type: UserResponseDto })
  @SwaggerApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ApiResponse<User>> {
    const user = await this.usersService.findOne(id);
    return this.responseBuilder
      .status(HttpStatus.OK)
      .messageText('User retrieved successfully')
      .data(user)
      .pagination(null)
      .build();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'User UUID' })
  @SwaggerApiResponse({ status: 204, description: 'User deleted successfully (No Content).' })
  @SwaggerApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}