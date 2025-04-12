import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Blog } from '../blogs/blogs.entity';
import { SeedAdminAndBlogs1681171200000 } from './migrations/1681171200000-SeedAdminAndBlogs';
import { config } from 'dotenv';

config();

const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      type: 'postgres',
      ssl: {
        rejectUnauthorized: false
      },
      entities: [User, Blog],
      migrations: [SeedAdminAndBlogs1681171200000],
      synchronize: false,
    };
  }

  const host = process.env.RAILWAY_PRIVATE_DOMAIN || process.env.DB_HOST || 'localhost';

  return {
    type: 'postgres',
    host,
    port: +(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'railway',
    entities: [User, Blog],
    migrations: [SeedAdminAndBlogs1681171200000],
    synchronize: false,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  };
};

export const AppDataSource = new DataSource(getDatabaseConfig() as any);