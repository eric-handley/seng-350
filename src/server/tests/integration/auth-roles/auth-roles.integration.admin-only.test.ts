import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupAuthRolesTests } from './auth-roles.integration.test-setup';

describe('Authorization (e2e) - /users endpoint (Admin only)', () => {
  let app: INestApplication;
  let staffUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupAuthRolesTests();
    app = setup.app;
    staffUser = setup.staffUser;
    adminUser = setup.adminUser;
  });

  afterAll(async () => {
    await app.close();
  });

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
