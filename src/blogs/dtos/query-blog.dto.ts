import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max, IsArray, ArrayNotEmpty } from 'class-validator';

export class QueryBlogDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', minimum: 1, default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Global search term (searches title and content)', type: String })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Sort order. Comma-separated fields. Prefix with "-" for DESC (e.g., -createdAt,title)',
    type: String,
    example: '-createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Fields to include. Comma-separated (e.g., title,slug,createdAt)',
    type: String,
    example: 'title,slug',
  })
  @IsOptional()
  @IsString()
  fields?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated). Returns blogs containing ANY of the specified tags.',
    type: String,
    example: 'nestjs,docker',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Filter by exact title', type: String })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date (e.g., createdAt[gte]=2023-10-26)', type: String })
  @ApiPropertyOptional({ description: 'Filter by creation date range (e.g., `[between]2024-12-31,2025-04-22`).', type: String })
  @IsOptional()

  createdAt?: any;
}