import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { NotFoundFilter } from './filters/not-found.filter'; // Import the filter

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.DOMAIN || ''],
  });

  // Use the custom 404 filter
  app.useGlobalFilters(new NotFoundFilter());

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
