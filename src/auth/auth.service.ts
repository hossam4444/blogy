import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtPayloadDto } from './dtos/jwt-payload.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async register(user: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(user.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const newUser = await this.usersService.create(user);
    const payload = plainToInstance(JwtPayloadDto, newUser, { excludeExtraneousValues: true });
    const token = await this.signToken(payload);

    return { userId: newUser.id, token };
  }

  async login(user: LoginDto) {
    const existingUser = await this.usersService.findByEmail(user.email);
    if (!existingUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(user.password, existingUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = plainToInstance(JwtPayloadDto, existingUser, { excludeExtraneousValues: true });
    const token = await this.signToken(payload);
    return { userId: existingUser.id, token };
  }

  async signToken(payload: JwtPayloadDto): Promise<string> {
    try {
      return await this.jwtService.signAsync({ ...payload });
    } catch (error) {
      console.error('Error signing token:', error);
      throw new UnauthorizedException('Error generating token');
    }
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      return decoded;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
