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
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import session = require('express-session');
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../src/database/entities/user.entity';
import { ValidationExceptionFilter } from '../../src/filters/validation-exception.filter';

async function setupTestAppWithAuth() {
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

  app.useGlobalFilters(new ValidationExceptionFilter());

  await app.init();

  return {
    app,
    userRepository: moduleFixture.get<Repository<User>>(getRepositoryToken(User)),
  };
}

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let testUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    testUser = userRepository.create({
      email: `auth-staff-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'Staff',
      role: UserRole.STAFF,
    });
    testUser = await userRepository.save(testUser);

    adminUser = userRepository.create({
      email: `auth-admin-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'Admin',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.role).toBe(UserRole.STAFF);
          expect(res.body.password).toBeUndefined();
          expect(res.body.password_hash).toBeUndefined();
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@uvic.ca', password: 'password123' })
        .expect(401);
    });
  });

  describe('GET /api/auth/session', () => {
    it('should return session for logged-in user', async () => {
      const agent = request.agent(app.getHttpServer());

      // Login
      await agent
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' })
        .expect(200);

      // Check session
      return agent
        .get('/api/auth/session')
        .expect(200)
        .expect((res) => {
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.role).toBe(UserRole.STAFF);
        });
    });

    it('should return 401 for unauthenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/auth/session')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Not authenticated');
        });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and destroy session', async () => {
      const agent = request.agent(app.getHttpServer());

      // Login
      await agent
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' })
        .expect(200);

      // Logout
      await agent.post('/api/auth/logout').expect(204);

      // Session should be destroyed
      return agent.get('/api/auth/session').expect(401);
    });
  });
});

describe('Authorization (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let staffUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    staffUser = userRepository.create({
      email: `authz-staff-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    staffUser = await userRepository.save(staffUser);

    adminUser = userRepository.create({
      email: `authz-admin-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users endpoint (Admin only)', () => {
    it('should deny access to unauthenticated users', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should deny access to non-admin users', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/users').expect(403);
    });

    it('should allow access to admin users', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'password123' })
        .expect(200);

      return agent
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
        });
    });

    it('should allow admin to create users', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'password123' })
        .expect(200);

      const newUser = {
        email: `new-user-${Date.now()}@uvic.ca`,
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        role: UserRole.STAFF,
      };

      return agent
        .post('/users')
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe(newUser.email);
          expect(res.body.role).toBe(newUser.role);
        });
    });

    it('should deny staff from creating users', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      const newUser = {
        email: `blocked-user-${Date.now()}@uvic.ca`,
        password: 'password123',
        first_name: 'Blocked',
        last_name: 'User',
        role: UserRole.STAFF,
      };

      return agent.post('/users').send(newUser).expect(403);
    });
  });
});
