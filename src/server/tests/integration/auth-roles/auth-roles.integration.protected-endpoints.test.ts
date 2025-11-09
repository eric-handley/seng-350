import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupAuthRolesTests } from './auth-roles.integration.test-setup';

describe('Authorization (e2e) - Protected endpoints (authenticated users)', () => {
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
