import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

describe('User management edge cases (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let adminUser: User;
  let otherAdminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    adminUser = userRepository.create({
      email: `admin-edge-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'Edge',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);

    otherAdminUser = userRepository.create({
      email: `other-admin-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Other',
      last_name: 'Admin',
      role: UserRole.ADMIN,
    });
    otherAdminUser = await userRepository.save(otherAdminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should not allow admin to delete themselves', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    // Delete self - prevent
    return agent.delete(`/users/${adminUser.id}`).expect(403);
  });

  it('should not allow admin to change their own role', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: otherAdminUser.email, password: 'password123' })
      .expect(200);

    // Change own role to STAFF
    return agent
      .patch(`/users/${otherAdminUser.id}`)
      .send({ role: UserRole.STAFF })
      .expect(403);
  });

  it('should allow admin to delete other users', async () => {
    const agent = request.agent(app.getHttpServer());
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create a user to delete
    const userToDelete = userRepository.create({
      email: `delete-target-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Delete',
      last_name: 'Target',
      role: UserRole.STAFF,
    });
    await userRepository.save(userToDelete);

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    // Delete other user - should succeed
    return agent.delete(`/users/${userToDelete.id}`).expect(204);
  });

  it('should allow admin to change other users roles', async () => {
    const agent = request.agent(app.getHttpServer());
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create a user to modify
    const userToModify = userRepository.create({
      email: `modify-target-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Modify',
      last_name: 'Target',
      role: UserRole.STAFF,
    });
    await userRepository.save(userToModify);

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    // Change other user's role - should succeed
    return agent
      .patch(`/users/${userToModify.id}`)
      .send({ role: UserRole.ADMIN })
      .expect(200)
      .expect((res) => {
        expect(res.body.role).toBe(UserRole.ADMIN);
      });
  });

  it('should allow admin to update their own non-role fields', async () => {
    const agent = request.agent(app.getHttpServer());
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create a fresh admin for this test
    const selfUpdateAdmin = userRepository.create({
      email: `self-update-admin-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'SelfUpdate',
      last_name: 'Admin',
      role: UserRole.ADMIN,
    });
    await userRepository.save(selfUpdateAdmin);

    await agent
      .post('/api/auth/login')
      .send({ email: selfUpdateAdmin.email, password: 'password123' })
      .expect(200);

    // Update own non-role fields - should succeed
    return agent
      .patch(`/users/${selfUpdateAdmin.id}`)
      .send({ first_name: 'Updated', last_name: 'Name' })
      .expect(200)
      .expect((res) => {
        expect(res.body.first_name).toBe('Updated');
        expect(res.body.last_name).toBe('Name');
        expect(res.body.role).toBe(UserRole.ADMIN); // Role unchanged
      });
  });

  it('should reject creating user with duplicate email', async () => {
    const agent = request.agent(app.getHttpServer());

    const hashedPassword = await bcrypt.hash('password123', 10);
    const existingUser = userRepository.create({
      email: `duplicate-test-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Existing',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    await userRepository.save(existingUser);

    // Login as admin with a fresh admin
    const freshAdmin = userRepository.create({
      email: `fresh-admin-dup-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Fresh',
      last_name: 'Admin',
      role: UserRole.ADMIN,
    });
    await userRepository.save(freshAdmin);

    await agent
      .post('/api/auth/login')
      .send({ email: freshAdmin.email, password: 'password123' })
      .expect(200);

    // Try to create user with same email
    return agent
      .post('/users')
      .send({
        email: existingUser.email,
        password: 'password123',
        first_name: 'Duplicate',
        last_name: 'User',
        role: UserRole.STAFF,
      })
      .expect(409);
  });
});
