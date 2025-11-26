import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Notes API')
    .setDescription('Simple notes, made for GoldenCity test.')
    .setVersion('0.1')
    .addServer('/v1', 'Local')
    .build();

  const document = () => SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: true,
  });
  SwaggerModule.setup('/', app, document, {
    customSiteTitle: 'Notes API',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
