import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';

import { User } from '../../../src/database/entities/user.entity';
import { setupAuthBasicTests } from './auth-basic.integration.test-setup';

describe('Auth endpoint validation (e2e)', () => {
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
