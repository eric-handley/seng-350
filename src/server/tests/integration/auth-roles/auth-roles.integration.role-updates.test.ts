import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

describe('Role update restrictions (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let staffUser: User;
  let registrarUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);
    const testId = randomUUID();

    staffUser = userRepository.create({
      email: `staff-role-test-${testId}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    staffUser = await userRepository.save(staffUser);

    registrarUser = userRepository.create({
      email: `registrar-role-test-${testId}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Registrar',
      last_name: 'User',
      role: UserRole.REGISTRAR,
    });
    registrarUser = await userRepository.save(registrarUser);

    adminUser = userRepository.create({
      email: `admin-role-test-${testId}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow STAFF to update own profile with role unchanged', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${staffUser.id}`)
      .send({ first_name: 'Updated', role: UserRole.STAFF })
      .expect(200)
      .expect((res) => {
        expect(res.body.first_name).toBe('Updated');
        expect(res.body.role).toBe(UserRole.STAFF);
      });
  });

  it('should block STAFF from changing own role to ADMIN', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${staffUser.id}`)
      .send({ role: UserRole.ADMIN })
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toContain('Admins');
      });
  });

  it('should block STAFF from changing own role to REGISTRAR', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${staffUser.id}`)
      .send({ role: UserRole.REGISTRAR })
      .expect(403);
  });

  it('should allow REGISTRAR to update own profile with role unchanged', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${registrarUser.id}`)
      .send({ first_name: 'UpdatedRegistrar', role: UserRole.REGISTRAR })
      .expect(200)
      .expect((res) => {
        expect(res.body.first_name).toBe('UpdatedRegistrar');
        expect(res.body.role).toBe(UserRole.REGISTRAR);
      });
  });

  it('should block REGISTRAR from changing own role to ADMIN', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${registrarUser.id}`)
      .send({ role: UserRole.ADMIN })
      .expect(403);
  });

  it('should allow ADMIN to update own profile with role unchanged', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    return agent
      .patch(`/users/${adminUser.id}`)
      .send({ first_name: 'UpdatedAdmin', role: UserRole.ADMIN })
      .expect(200)
      .expect((res) => {
        expect(res.body.first_name).toBe('UpdatedAdmin');
        expect(res.body.role).toBe(UserRole.ADMIN);
      });
  });
});
