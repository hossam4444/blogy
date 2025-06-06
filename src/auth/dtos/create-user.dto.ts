import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
  @IsString()
  firstName: string;
  @IsString()
  lastName: string;
  @IsOptional()
  @IsString()
  phone?: string;
}