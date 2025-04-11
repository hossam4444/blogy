import { IsString, IsArray, IsOptional } from 'class-validator';
import { User } from '../../users/user.entity';

export class UpdateBlogDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  editedBy?: User;
}