import { ApiProperty } from '@nestjs/swagger';
import { BaseApiResponseDto } from './api-response.dto';

export class AuthResponsePayloadDto {
  @ApiProperty({ description: "The UUID of the authenticated/registered user", example: "a1b2c3d4-e5f6-7890-1234-567890abcdef" })
  userId: string;

  @ApiProperty({ description: "JWT authentication token", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  token: string;
}

export class AuthResponseDto extends BaseApiResponseDto {
  @ApiProperty({ type: () => AuthResponsePayloadDto, nullable: true })
  data: AuthResponsePayloadDto | null;
}