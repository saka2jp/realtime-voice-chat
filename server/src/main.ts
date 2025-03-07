import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Server running on port ${port}`);

  // Log API status
  if (!process.env.OPENAI_API_KEY) {
    logger.warn(
      'OPENAI_API_KEY is not set. Voice processing will not work properly.',
    );
  } else {
    logger.log('OpenAI API key is configured.');
  }
}
bootstrap();
