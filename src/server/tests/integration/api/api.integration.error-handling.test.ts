import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import request from 'supertest';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupTestApp } from './api.integration.test-setup';

describe('Error handling (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let testUser: User;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    userRepository = setup.userRepository;

    testUser = userRepository.create({
      email: `test-errors-${Date.now()}@uvic.ca`,
      password_hash: 'hashedPassword',
      first_name: 'John',
      last_name: 'Doe',
      role: UserRole.STAFF,
    });
    testUser = await userRepository.save(testUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 403 when Staff tries to view non-existent user (permission check before existence check)', () => {
    const nonExistentId = '99999999-0000-0000-0000-000000000000';
    // Default test user is STAFF - permission check happens before existence check
    return request(app.getHttpServer())
      .get(`/users/${nonExistentId}`)
      .expect(403);
  });

  it('should return 400 for invalid UUID format', () => {
    const invalidId = 'invalid-uuid';
    return request(app.getHttpServer())
      .get(`/users/${invalidId}`)
      .expect(400);
  });

  it('should return 409 when creating user with existing email', async () => {
    const existingUser = {
      email: testUser.email,
      password: 'securePassword123',
      first_name: 'Jane',
      last_name: 'Smith',
      role: UserRole.STAFF,
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(existingUser)
      .expect(409);
  });
});
