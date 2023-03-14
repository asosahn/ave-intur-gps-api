import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const morgan = require('morgan');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  const configService = app.get<ConfigService>(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');
  app.use(
    morgan('dev', {
      skip: (req, res) => req.url === '/api/ping',
    }),
  );
  app.use(json({ limit: '100mb' }));
  const port = configService.get('port');
  const config = new DocumentBuilder()
    .addBearerAuth()
    .addServer(configService.get('API_MASTER_SWAGGER'))
    .setTitle(configService.get('name'))
    .setDescription(configService.get('description'))
    .setVersion(configService.get('version'))
    .addTag('main')
    .addTag('ping')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  console.log(`listen application on port => ${port}`);
  console.log(`connected on mongoDB => ${configService.get('MONGO_DATABASE')}`);
  console.log(
    `API_MASTER_SWAGGER => ${configService.get('API_MASTER_SWAGGER')}`,
  );
  console.log(`ROUTE => ${configService.get('ROUTE')}`);
  console.log(`Sever ready => ${process.env.NODE_ENV}`);
  await app.listen(port);
}
bootstrap();
