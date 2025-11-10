import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

export interface AuthBasicTestContext {
  app: INestApplication;
  userRepository: Repository<User>;
  testUser: User;
  adminUser: User;
}

export async function setupAuthBasicTests(): Promise<AuthBasicTestContext> {
  const setup = await setupTestAppWithAuth();
  const app = setup.app;
  const userRepository = setup.userRepository;

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  let testUser = userRepository.create({
    email: `auth-staff-${Date.now()}@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Test',
    last_name: 'Staff',
    role: UserRole.STAFF,
  });
  testUser = await userRepository.save(testUser);

  let adminUser = userRepository.create({
    email: `auth-admin-${Date.now()}@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Test',
    last_name: 'Admin',
    role: UserRole.ADMIN,
  });
  adminUser = await userRepository.save(adminUser);

  return {
    app,
    userRepository,
    testUser,
    adminUser,
  };
}
