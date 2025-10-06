import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { AuditLoggingInterceptor } from './shared/interceptors/audit-logging.interceptor';
import session from 'express-session';

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

  // Apply global exception filter for consistent error reporting
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Apply global audit logging interceptor
  const auditLoggingInterceptor = app.get(AuditLoggingInterceptor);
  app.useGlobalInterceptors(auditLoggingInterceptor);

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
  await app.listen(port, '0.0.0.0');
  console.warn(`NestJS server running on http://localhost:${port}`);
  console.warn(`Swagger API documentation available at http://localhost:${port}/api-docs`);
}

bootstrap();