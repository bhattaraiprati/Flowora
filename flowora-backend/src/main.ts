import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   const config = new DocumentBuilder()
    .setTitle('Flowora API')
    .setDescription('The Flowora API description')
    .setVersion('1.0')
    .addTag('flowora')
    .addBearerAuth()
    // .addOAuth2()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
