import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const nodeEnv = process.env.NODE_ENV;
const databaseUrl = process.env.DATABASE_URL;
const isProduction = nodeEnv === 'production';

if (!databaseUrl) {
  console.error(
    '[data-source.ts] CRITICAL ERROR: DATABASE_URL environment variable is not set!',
  );
  console.error(
    '[data-source.ts] Ensure it is defined in your .env file (for local CLI) or docker-compose.yml or Railway variables.',
  );
  throw new Error('DATABASE_URL environment variable is required but not provided.');
}

const maskedUrl = databaseUrl.replace(/:([^:]+)@/, ':<password>@');
console.log(`[data-source.ts] NODE_ENV: ${nodeEnv}`);
console.log(`[data-source.ts] isProduction: ${isProduction}`);
console.log(`[data-source.ts] Using DATABASE_URL: ${maskedUrl}`);

const sslConfig = isProduction
  ? { rejectUnauthorized: false }
  : false;

console.log(`[data-source.ts] SSL Configuration determined as:`, sslConfig);

export const AppDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: databaseUrl,
  synchronize: false,
  logging: !isProduction ? ['query', 'error'] : ['error'],

  entities: [__dirname + '/../**/*.entity{.js,.ts}'],
  migrations: [__dirname + '/migrations/*{.js,.ts}'],
  migrationsTableName: 'typeorm_migrations',
  ssl: sslConfig,
};

export default new DataSource(AppDataSourceOptions);