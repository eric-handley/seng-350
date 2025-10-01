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

  describe('Protected endpoints (authenticated users)', () => {
    it('should deny unauthenticated access to /bookings', () => {
      return request(app.getHttpServer()).get('/bookings').expect(401);
    });

    it('should deny unauthenticated access to /rooms', () => {
      return request(app.getHttpServer()).get('/rooms').expect(401);
    });

    it('should deny unauthenticated access to /buildings', () => {
      return request(app.getHttpServer()).get('/buildings').expect(401);
    });

    it('should deny unauthenticated access to /equipment', () => {
      const testRoomId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/equipment/room/${testRoomId}`)
        .expect(401);
    });

    it('should allow Staff to access /bookings', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/bookings').expect(200);
    });

    it('should allow Staff to access /rooms', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/rooms').expect(200);
    });

    it('should allow Staff to access /buildings', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: staffUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/buildings').expect(200);
    });

    it('should allow Admin to access /bookings', async () => {
      const agent = request.agent(app.getHttpServer());

      await agent
        .post('/api/auth/login')
        .send({ email: adminUser.email, password: 'password123' })
        .expect(200);

      return agent.get('/bookings').expect(200);
    });
  });
});

describe('REGISTRAR role (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let registrarUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    registrarUser = userRepository.create({
      email: `registrar-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Registrar',
      last_name: 'User',
      role: UserRole.REGISTRAR,
    });
    registrarUser = await userRepository.save(registrarUser);

    adminUser = userRepository.create({
      email: `admin-registrar-test-${Date.now()}@uvic.ca`,
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

  it('should allow Registrar to login', async () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200)
      .expect((res) => {
        expect(res.body.role).toBe(UserRole.REGISTRAR);
      });
  });

  it('should allow Registrar to access /bookings', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent.get('/bookings').expect(200);
  });

  it('should allow Registrar to access /rooms', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent.get('/rooms').expect(200);
  });

  it('should allow Registrar to access /buildings', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent.get('/buildings').expect(200);
  });

  it('should deny Registrar access to /users (admin only)', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent.get('/users').expect(403);
  });

  it('should deny Registrar from creating users', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: `blocked-by-registrar-${Date.now()}@uvic.ca`,
      password: 'password123',
      first_name: 'Blocked',
      last_name: 'User',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newUser).expect(403);
  });
});

describe('Session persistence (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let testUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    testUser = userRepository.create({
      email: `session-test-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Session',
      last_name: 'Test',
      role: UserRole.STAFF,
    });
    testUser = await userRepository.save(testUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should maintain session across multiple requests', async () => {
    const agent = request.agent(app.getHttpServer());

    // Login once
    await agent
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'password123' })
      .expect(200);

    // Make multiple subsequent requests without re-authenticating
    await agent.get('/api/auth/session').expect(200);
    await agent.get('/bookings').expect(200);
    await agent.get('/rooms').expect(200);
    await agent.get('/buildings').expect(200);

    // Verify session still works
    return agent
      .get('/api/auth/session')
      .expect(200)
      .expect((res) => {
        expect(res.body.user.email).toBe(testUser.email);
      });
  });

  it('should not share sessions between different users', async () => {
    const agent1 = request.agent(app.getHttpServer());
    const agent2 = request.agent(app.getHttpServer());

    // Login with first user
    await agent1
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'password123' })
      .expect(200);

    // Agent2 should not have a session
    await agent2.get('/api/auth/session').expect(401);

    // Agent1 should still have a session
    return agent1
      .get('/api/auth/session')
      .expect(200)
      .expect((res) => {
        expect(res.body.user.email).toBe(testUser.email);
      });
  });
});

describe('Password validation (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    adminUser = userRepository.create({
      email: `admin-pwd-test-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'PwdTest',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject passwords shorter than 6 characters', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: `short-pwd-${Date.now()}@uvic.ca`,
      password: '12345', // Only 5 characters
      first_name: 'Short',
      last_name: 'Password',
      role: UserRole.STAFF,
    };

    return agent
      .post('/users')
      .send(newUser)
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('password');
      });
  });

  it('should accept passwords with exactly 6 characters', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: `min-pwd-${Date.now()}@uvic.ca`,
      password: '123456', // Exactly 6 characters
      first_name: 'Min',
      last_name: 'Password',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newUser).expect(201);
  });

  it('should reject empty passwords', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: `empty-pwd-${Date.now()}@uvic.ca`,
      password: '',
      first_name: 'Empty',
      last_name: 'Password',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newUser).expect(400);
  });
});

describe('Email validation (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    adminUser = userRepository.create({
      email: `admin-email-test-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'EmailTest',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject invalid email formats', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com', 'spaces in@email.com'];

    for (const email of invalidEmails) {
      await agent
        .post('/users')
        .send({
          email,
          password: 'password123',
          first_name: 'Invalid',
          last_name: 'Email',
          role: UserRole.STAFF,
        })
        .expect(400);
    }
  });

  it('should accept valid email formats', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: `valid.email+tag-${Date.now()}@uvic.ca`,
      password: 'password123',
      first_name: 'Valid',
      last_name: 'Email',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newUser).expect(201);
  });

  it('should reject empty email', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: '',
      password: 'password123',
      first_name: 'Empty',
      last_name: 'Email',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newUser).expect(400);
  });
});

describe('Auth endpoint validation (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let testUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    testUser = userRepository.create({
      email: `auth-validation-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Auth',
      last_name: 'Validation',
      role: UserRole.STAFF,
    });
    testUser = await userRepository.save(testUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject login with missing email', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ password: 'password123' })
      .expect(400);
  });

  it('should reject login with missing password', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email })
      .expect(400);
  });

  it('should reject login with empty email', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: '', password: 'password123' })
      .expect(400);
  });

  it('should reject login with empty password', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: '' })
      .expect(400);
  });

  it('should reject login with invalid email format', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'notanemail', password: 'password123' })
      .expect(400);
  });

  it('should reject login with malformed JSON', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(400);
  });
});

describe('User management edge cases (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let adminUser: User;
  let otherAdminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    adminUser = userRepository.create({
      email: `admin-edge-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'Edge',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);

    otherAdminUser = userRepository.create({
      email: `other-admin-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Other',
      last_name: 'Admin',
      role: UserRole.ADMIN,
    });
    otherAdminUser = await userRepository.save(otherAdminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow admin to delete themselves', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    // Delete self - should succeed (business logic may want to prevent this)
    return agent.delete(`/users/${adminUser.id}`).expect(204);
  });

  it('should allow admin to change their own role', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: otherAdminUser.email, password: 'password123' })
      .expect(200);

    // Change own role to STAFF
    return agent
      .patch(`/users/${otherAdminUser.id}`)
      .send({ role: UserRole.STAFF })
      .expect(200)
      .expect((res) => {
        expect(res.body.role).toBe(UserRole.STAFF);
      });
  });

  it('should reject creating user with duplicate email', async () => {
    const agent = request.agent(app.getHttpServer());

    const hashedPassword = await bcrypt.hash('password123', 10);
    const existingUser = userRepository.create({
      email: `duplicate-test-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Existing',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    await userRepository.save(existingUser);

    // Login as admin with a fresh admin
    const freshAdmin = userRepository.create({
      email: `fresh-admin-dup-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Fresh',
      last_name: 'Admin',
      role: UserRole.ADMIN,
    });
    await userRepository.save(freshAdmin);

    await agent
      .post('/api/auth/login')
      .send({ email: freshAdmin.email, password: 'password123' })
      .expect(200);

    // Try to create user with same email
    return agent
      .post('/users')
      .send({
        email: existingUser.email,
        password: 'password123',
        first_name: 'Duplicate',
        last_name: 'User',
        role: UserRole.STAFF,
      })
      .expect(409);
  });
});

describe('Cross-user authorization (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let bookingRepository: Repository<import('../../src/database/entities/booking.entity').Booking>;
  let roomRepository: Repository<import('../../src/database/entities/room.entity').Room>;
  let staffUser1: User;
  let staffUser2: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const { getRepositoryToken } = await import('@nestjs/typeorm');
    const { Booking } = await import('../../src/database/entities/booking.entity');
    const { Room } = await import('../../src/database/entities/room.entity');

    bookingRepository = (app.get as any)(getRepositoryToken(Booking));
    roomRepository = (app.get as any)(getRepositoryToken(Room));

    const hashedPassword = await bcrypt.hash('password123', 10);

    staffUser1 = userRepository.create({
      email: `staff1-cross-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'One',
      role: UserRole.STAFF,
    });
    staffUser1 = await userRepository.save(staffUser1);

    staffUser2 = userRepository.create({
      email: `staff2-cross-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'Two',
      role: UserRole.STAFF,
    });
    staffUser2 = await userRepository.save(staffUser2);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow user to view their own bookings', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    return agent
      .get(`/bookings?userId=${staffUser1.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
      });
  });

  it('should prevent user from viewing other users bookings', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    // User1 should NOT be able to see user2's bookings
    return agent
      .get(`/bookings?userId=${staffUser2.id}`)
      .expect(403);
  });

  it('should prevent user from creating bookings for other users', async () => {
    const agent = request.agent(app.getHttpServer());

    // Get a test room
    const room = await roomRepository.findOne({ where: {} });
    if (!room) {
      throw new Error('No rooms found for testing');
    }

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    const booking = {
      room_id: room.id,
      start_time: '2027-01-01T10:00:00Z',
      end_time: '2027-01-01T11:00:00Z',
    };

    // User1 should NOT be able to create a booking for User2
    return agent
      .post(`/bookings?userId=${staffUser2.id}`)
      .send(booking)
      .expect(403);
  });

  it('should allow user to create bookings for themselves', async () => {
    const agent = request.agent(app.getHttpServer());

    // Get a test room
    const room = await roomRepository.findOne({ where: {} });
    if (!room) {
      throw new Error('No rooms found for testing');
    }

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    const booking = {
      room_id: room.id,
      start_time: '2027-01-01T12:00:00Z',
      end_time: '2027-01-01T13:00:00Z',
    };

    // User1 CAN create a booking for themselves
    return agent
      .post(`/bookings?userId=${staffUser1.id}`)
      .send(booking)
      .expect(201)
      .expect((res) => {
        expect(res.body.user_id).toBe(staffUser1.id);
      });
  });
});
