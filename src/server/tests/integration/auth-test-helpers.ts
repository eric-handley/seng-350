// Mock ESM-only module to avoid Jest transform errors
jest.mock('@auth/express', () => ({
  ExpressAuth: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Ensure AppModule connects to the dedicated test services
(() => {
  process.env.PGHOST = process.env.PGHOST_TEST ?? 'localhost';
  process.env.PGPORT = process.env.PGPORT_TEST ?? '5433';
  process.env.PGUSER = process.env.PGUSER_TEST ?? 'test';
  process.env.PGPASSWORD = process.env.PGPASSWORD_TEST ?? 'test';
  process.env.PGDATABASE = process.env.PGDATABASE_TEST ?? 'test_db';
  process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
  process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
})();

jest.setTimeout(30000);

import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import session from 'express-session';
import { Repository } from 'typeorm';

import { User } from '../../src/database/entities/user.entity';
import { GlobalExceptionFilter } from '../../src/filters/global-exception.filter';

export async function setupTestAppWithAuth() {
  const { AppModule } = await import('../../src/app/app.module');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Configure session middleware (same as main.ts)
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // false for tests
        maxAge: 1000 * 60 * 60,
        sameSite: 'lax',
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => {
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
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();

  return {
    app,
    userRepository: moduleFixture.get<Repository<User>>(getRepositoryToken(User)),
  };
}
