import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';

import { User } from '../../../src/database/entities/user.entity';
import { setupUserPermissionsTests, seedUsersWithRoles } from './user-permissions.integration.test-setup';

describe('User viewing permissions (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let staffUser1: User;
  let staffUser2: User;
  let registrarUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupUserPermissionsTests();
    app = setup.app;
    userRepository = setup.userRepository;

    const users = await seedUsersWithRoles(userRepository);
    staffUser1 = users.staffUser1;
    staffUser2 = users.staffUser2;
    registrarUser = users.registrarUser;
    adminUser = users.adminUser;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should block STAFF from viewing another STAFF user record', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    return agent.get(`/users/${staffUser2.id}`).expect(403);
  });

  it('should block STAFF from viewing ADMIN user record', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    return agent.get(`/users/${adminUser.id}`).expect(403);
  });

  it('should allow REGISTRAR to view any user record', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    await agent.get(`/users/${staffUser1.id}`).expect(200);
    await agent.get(`/users/${adminUser.id}`).expect(200);
  });

  it('should allow ADMIN to view any user record', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    await agent.get(`/users/${staffUser1.id}`).expect(200);
    await agent.get(`/users/${registrarUser.id}`).expect(200);
  });
});
