import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationExceptionFilter } from './filters/validation-exception.filter';
import session = require('express-session');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'dev-session-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      const formattedErrors = errors.map(error => {
        const constraints = error.constraints;
        if (constraints) {
          return `${error.property}: ${Object.values(constraints).join(', ')}`;
        }
        return `${error.property}: validation failed`;
      });
      return new BadRequestException({
        message: formattedErrors,
        error: 'Validation Failed',
        statusCode: 400,
      });
    },
  }));

  // Apply global exception filter for better error reporting
  app.useGlobalFilters(new ValidationExceptionFilter());

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('SENG 350 API')
    .setDescription('API documentation for SENG 350 project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.warn(`NestJS server running on http://localhost:${port}`);
  console.warn(`Swagger API documentation available at http://localhost:${port}/api-docs`);
}

bootstrap();