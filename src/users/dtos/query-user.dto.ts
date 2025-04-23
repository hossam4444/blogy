import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max, IsEmail, IsEnum } from 'class-validator';
import { User } from '../user.entity';

type UserRole = User['role']; // 'Admin' | 'Editor' | undefined

export class QueryUserDto {
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

  @ApiPropertyOptional({ description: 'Global search term (searches firstName, lastName, email)', type: String })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Sort order. Comma-separated fields. Prefix with "-" for DESC (e.g., -createdAt,lastName). Allowed: id, firstName, lastName, email, role, createdAt, updatedAt',
    type: String,
    example: '-createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Fields to include. Comma-separated (e.g., firstName,lastName,email,role). Password is never included.',
    type: String,
    example: 'id,firstName,email,role',
  })
  @IsOptional()
  @IsString()
  fields?: string;

  @ApiPropertyOptional({ description: 'Filter by exact first name', type: String })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Filter by exact last name', type: String })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Filter by exact email', type: String })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Filter by exact phone number', type: String })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Filter by role', enum: ['Admin', 'Editor'] })
  @IsOptional()
  @IsEnum(['Admin', 'Editor'])
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by creation date (e.g., `createdAt=[>=]2024-01-01`)', type: String })
  @IsOptional()
  createdAt?: any;
}