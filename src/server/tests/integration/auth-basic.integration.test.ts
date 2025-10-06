import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../src/database/entities/user.entity';
import { setupTestAppWithAuth } from './auth-test-helpers';

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
