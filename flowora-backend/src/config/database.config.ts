import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  // host: process.env.DB_HOST || 'localhost',
  // port: parseInt(process.env.DB_PORT || '3000', 10) || 5432,
  // username: process.env.DB_USERNAME || 'postgres',
  // password: process.env.DB_PASSWORD || '',
  // name: process.env.DB_NAME || 'project_management',
  url: process.env.DATABASE_URL,
}));