import { IsOptional, IsNumber, IsString, IsArray, IsEnum, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryBlogDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : 10))
  limit?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    const allowedFields = ['createdAt', 'title', 'updatedAt'];
    return allowedFields.includes(value) ? value : 'createdAt';
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  @Transform(({ value }) => value?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
  order?: 'ASC' | 'DESC';
}