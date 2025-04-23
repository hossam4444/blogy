import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { ResponseBuilderService, ApiResponse } from '../common/services/response-builder.service';
import { AuthResponseDto, AuthResponsePayloadDto } from '../common/dtos/auth-response.dto';
import { ApiTags, ApiOperation, ApiBody, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly responseBuilder: ResponseBuilderService<AuthResponsePayloadDto>,
  ) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    type: CreateUserDto,
    description: 'User registration details',
    examples: {
      a_sample_user: {
        summary: 'Sample user registration',
        value: {
          email: "new.user@example.com",
          password: "SecurePassword123!",
          firstName: "New",
          lastName: "User",
          phone: "+15559876543"
        } as CreateUserDto
      },
      minimal_user: {
        summary: 'Minimal user registration',
        value: {
          email: "minimal.user@example.com",
          password: "AnotherPassword!",
          firstName: "Minimal",
          lastName: "Register",
        } as CreateUserDto
      }
    }
  })
  @SwaggerApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully.', type: AuthResponseDto })
  @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error or invalid input.' })
  @SwaggerApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User already exists.' })
  async register(
    @Body() body: CreateUserDto,
  ): Promise<ApiResponse<AuthResponsePayloadDto>> {
    const authPayload = await this.authService.register(body);
    return this.responseBuilder
      .status(HttpStatus.CREATED)
      .messageText('User registered successfully')
      .data(authPayload)
      .pagination(null)
      .build();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in an existing user' })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      a_sample_login: {
        summary: 'Sample user login',
        value: {
          email: "test.user@example.com",
          password: "Password123!"
        } as LoginDto
      }
    }
  })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully.', type: AuthResponseDto })
  @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error or invalid input.' })
  @SwaggerApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials.' })
  async login(
    @Body() body: LoginDto
  ): Promise<ApiResponse<AuthResponsePayloadDto>> {
    const authPayload = await this.authService.login(body);
    return this.responseBuilder
      .status(HttpStatus.OK)
      .messageText('Login successful')
      .data(authPayload)
      .pagination(null)
      .build();
  }
}