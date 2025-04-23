import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination-meta.dto';
import { HttpStatus } from '@nestjs/common';

export class BaseApiResponseDto {
  @ApiProperty({ enum: HttpStatus, example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ type: () => PaginationMetaDto, required: false, nullable: true })
  pagination?: PaginationMetaDto | null;

}

import { Blog } from '../../blogs/blogs.entity';

export class BlogResponseDto extends BaseApiResponseDto {
  @ApiProperty({ type: () => Blog, nullable: true })
  data: Blog | null;
}

export class BlogListResponseDto extends BaseApiResponseDto {
  @ApiProperty({ type: () => [Blog], nullable: true })
  data: Blog[] | null;
}