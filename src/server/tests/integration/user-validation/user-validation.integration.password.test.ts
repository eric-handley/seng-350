import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupUserValidationTests } from './user-validation.integration.test-setup';

describe('Password validation (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupUserValidationTests();
    app = setup.app;
    userRepository = setup.userRepository;
    adminUser = setup.adminUser;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject passwords shorter than 6 characters', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: `short-pwd-${Date.now()}@uvic.ca`,
      password: '12345', // Only 5 characters
      first_name: 'Short',
      last_name: 'Password',
      role: UserRole.STAFF,
    };

    return agent
      .post('/users')
      .send(newUser)
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe('Validation failed');
        expect(Array.isArray(res.body.error)).toBe(true);
        expect(res.body.error.some((msg: string) => msg.includes('password'))).toBe(true);
      });
  });

  it('should accept passwords with exactly 6 characters', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: `min-pwd-${Date.now()}@uvic.ca`,
      password: '123456', // Exactly 6 characters
      first_name: 'Min',
      last_name: 'Password',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newUser).expect(201);
  });

  it('should reject empty passwords', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: `empty-pwd-${Date.now()}@uvic.ca`,
      password: '',
      first_name: 'Empty',
      last_name: 'Password',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newUser).expect(400);
  });
});
