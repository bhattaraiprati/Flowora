import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  user: process.env.GOOGLE_USERNAME_EMAIL,
  pass: process.env.GOOGLE_APP_PASSWORD,
}));