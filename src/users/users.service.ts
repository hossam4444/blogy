import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from '../auth/dtos/create-user.dto';
import { QueryUserDto } from './dtos/query-user.dto';
import { ApiFeaturesService } from '../common/services/api-features.service';
import { PaginationMeta } from '../common/interfaces/pagination-meta.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'firstName', 'lastName', 'email', 'password', 'role', 'createdAt', 'updatedAt', 'phone'], // Explicitly select password
    });
    return user;
  }

  async findAll(
    queryDto: QueryUserDto
  ): Promise<{ data: User[], meta: PaginationMeta | null }> {
    try {
      const selectableColumns = this.userRepository.metadata.columns
        .map(col => col.propertyName)
        .filter(name => name !== 'password');

      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .select(selectableColumns.map(col => `user.${col}`));

      const apiFeatures = new ApiFeaturesService<User>().init(
        queryBuilder,
        queryDto,
      );

      apiFeatures
        .filter()
        .search(['firstName', 'lastName', 'email'])
        .sort()
        .limitFields();

      await apiFeatures.paginate();
      const users = await apiFeatures.getMany();

      return {
        data: users,
        meta: apiFeatures.paginationMeta,
      };

    } catch (error) {
      console.error('Error in UsersService.findAll:', error);
      if (error.query) {
        console.error("Failed SQL Query:", error.query);
        console.error("Failed SQL Parameters:", error.parameters);
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt', 'updatedAt', 'phone'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(userDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(userDto.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    const newUser = this.userRepository.create(userDto);
    return await this.userRepository.save(newUser);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}