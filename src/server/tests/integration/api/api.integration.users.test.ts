import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import request, { Response } from 'supertest';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupTestApp } from './api.integration.test-setup';

describe('/users (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    userRepository = setup.userRepository;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST) should create a new user', () => {
    const newUser = {
      email: `newuser-${Date.now()}@uvic.ca`,
      password: 'securePassword123',
      first_name: 'John',
      last_name: 'Doe',
      role: UserRole.STAFF,
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(newUser)
      .expect(201)
      .expect((res: Response) => {
        expect(res.body.email).toBe(newUser.email);
        expect(res.body.role).toBe(newUser.role);
        expect(res.body.password).toBeUndefined();
      });
  });

  it('/users (GET) should return all users', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/users/:id (GET) should return a specific user (Staff viewing own profile)', async () => {
    // Create a Staff user with the same ID as the default test user
    const testUser = userRepository.create({
      id: '00000000-0000-0000-0000-000000000000',
      email: 'test@uvic.ca',
      password_hash: 'hashedPassword',
      first_name: 'Test',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    await userRepository.save(testUser);

    return request(app.getHttpServer())
      .get(`/users/${testUser.id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.id).toBe(testUser.id);
        expect(res.body.email).toBe(testUser.email);
      });
  });

  it('/users/:id (PATCH) should deny Staff from updating other users', async () => {
    const otherUser = userRepository.create({
      email: `test-patch-${Date.now()}@uvic.ca`,
      password_hash: 'hashedPassword',
      first_name: 'John',
      last_name: 'Doe',
      role: UserRole.STAFF,
    });
    const savedUser = await userRepository.save(otherUser);
    const updateData = { role: UserRole.REGISTRAR };

    // Default test user is STAFF trying to update another user - should be denied
    return request(app.getHttpServer())
      .patch(`/users/${savedUser.id}`)
      .send(updateData)
      .expect(403);
  });
});
