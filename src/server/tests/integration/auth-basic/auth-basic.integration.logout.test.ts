import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { User } from '../../../src/database/entities/user.entity';
import { setupAuthBasicTests } from './auth-basic.integration.test-setup';

describe('Authentication (e2e) - POST /api/auth/logout', () => {
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
