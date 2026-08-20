/* eslint-disable prettier/prettier */
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: configService.getOrThrow<string>('CLIENT_URL'),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('SyncSpace API')
    .setDescription('API documentation for the SyncSpace chat application.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = configService.getOrThrow<number>('PORT');

  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(
    `📚 Swagger running on http://localhost:${port}/api/docs`,
  );
}

bootstrap();
