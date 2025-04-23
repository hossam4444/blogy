import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BlogsModule } from './blogs/blogs.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { User } from './users/user.entity';
import { Blog } from './blogs/blogs.entity';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDISHOST');
        const port = configService.get<number>('REDISPORT');
        const password = configService.get<string>('REDISPASSWORD');

        const redisConfig: any = {
          store: redisStore,
          socket: { host: host, port: port },
          ttl: 60, // test TTL
        };

        if (password) {
          redisConfig.password = password;
        }
        console.log(`Connecting to Redis using standard vars: ${host}:${port}`);
        return redisConfig;
      },
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV');
        const isProduction = nodeEnv === 'production';

        if (!databaseUrl) {
          console.error("CRITICAL: DATABASE_URL environment variable is not set!");
        } else {
          console.log('Using DATABASE_URL for DB connection.');
        }


        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [User, Blog],
          synchronize: !isProduction,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          logging: !isProduction ? ['query', 'error'] : ['error'],
        } as TypeOrmModuleOptions;
      },
    }),

    UsersModule,
    AuthModule,
    BlogsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }