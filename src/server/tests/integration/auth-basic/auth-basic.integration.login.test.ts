import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupAuthBasicTests } from './auth-basic.integration.test-setup';

describe('Authentication (e2e) - POST /api/auth/login', () => {
  let app: INestApplication;
  let testUser: User;

  beforeAll(async () => {
    const setup = await setupAuthBasicTests();
    app = setup.app;
    testUser = setup.testUser;
  });

  afterAll(async () => {
    await app.close();
  });

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
