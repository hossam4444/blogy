import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserDto } from 'src/auth/dtos/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) { }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email }
    });
    return user;
  }

  async findAll(): Promise<User[] | []> {
    // find all users
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id }
    });
    return user;
  }

  async create(user: CreateUserDto): Promise<User> {
    // CREATE USER 
    const newUser = this.userRepository.create(user);
    // push to db using repository
    return await this.userRepository.save(newUser);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
