import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.warn(`NestJS server running on http://localhost:${port}`);
}

bootstrap();