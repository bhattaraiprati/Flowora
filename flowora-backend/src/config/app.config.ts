import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '5000', 10) || 5000,
  apiUrl: process.env.API_URL || 'http://localhost:5000',
}));
