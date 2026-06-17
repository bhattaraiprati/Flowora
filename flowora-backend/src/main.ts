import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const configService = app.get(ConfigService);

  // const corsConfig = configService.get('cors');
  // app.enableCors(corsConfig);

  app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
