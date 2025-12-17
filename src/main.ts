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
    .setDescription(
      'Simple Notes API for benchmarking purposes. Supports both in-memory and disk persistence.',
    )
    .setVersion('0.1.0')
    .addServer('/v1', 'Local')
    .build();

  const document = () =>
    SwaggerModule.createDocument(app, config, {
      ignoreGlobalPrefix: true,
    });
  SwaggerModule.setup('/', app, document, {
    customSiteTitle: 'Notes API',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Error during app bootstrap:', err);
  process.exit(1);
});
