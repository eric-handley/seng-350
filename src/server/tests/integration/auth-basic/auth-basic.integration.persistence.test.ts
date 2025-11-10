import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

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
