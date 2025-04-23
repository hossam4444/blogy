import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';
import { BaseApiResponseDto } from './api-response.dto';

export class UserResponseDto extends BaseApiResponseDto {
  @ApiProperty({ type: () => User, nullable: true })
  data: User | null;
}

export class UserListResponseDto extends BaseApiResponseDto {
  @ApiProperty({ type: () => [User], nullable: true })
  data: User[] | null;
}