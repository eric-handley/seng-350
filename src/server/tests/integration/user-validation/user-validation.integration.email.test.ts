import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupUserValidationTests } from './user-validation.integration.test-setup';

describe('Email validation (e2e)', () => {
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

  it('should reject invalid email formats', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com', 'spaces in@email.com'];

    for (const email of invalidEmails) {
      await agent
        .post('/users')
        .send({
          email,
          password: 'password123',
          first_name: 'Invalid',
          last_name: 'Email',
          role: UserRole.STAFF,
        })
        .expect(400);
    }
  });

  it('should accept valid email formats', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: `valid.email+tag-${Date.now()}@uvic.ca`,
      password: 'password123',
      first_name: 'Valid',
      last_name: 'Email',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newUser).expect(201);
  });

  it('should reject empty email', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    const newUser = {
      email: '',
      password: 'password123',
      first_name: 'Empty',
      last_name: 'Email',
      role: UserRole.STAFF,
    };

    return agent.post('/users').send(newUser).expect(400);
  });
});
