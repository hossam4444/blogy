import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Blog } from '../blogs/blogs.entity';
import { SeedAdminAndBlogs1681171200000 } from './migrations/1681171200000-SeedAdminAndBlogs';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Blog],
  migrations: [SeedAdminAndBlogs1681171200000],
  synchronize: false,
});