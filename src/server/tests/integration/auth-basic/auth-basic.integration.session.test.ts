import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupAuthBasicTests } from './auth-basic.integration.test-setup';

describe('Authentication (e2e) - GET /api/auth/session', () => {
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
