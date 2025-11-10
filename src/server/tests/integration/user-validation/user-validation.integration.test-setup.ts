import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

export interface UserValidationTestContext {
  app: INestApplication;
  userRepository: Repository<User>;
  adminUser: User;
}

export async function setupUserValidationTests(): Promise<UserValidationTestContext> {
  const setup = await setupTestAppWithAuth();
  const app = setup.app;
  const userRepository = setup.userRepository;

  const hashedPassword = await bcrypt.hash('password123', 10);

  let adminUser = userRepository.create({
    email: `admin-pwd-test-${Date.now()}@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Admin',
    last_name: 'Test',
    role: UserRole.ADMIN,
  });
  adminUser = await userRepository.save(adminUser);

  return {
    app,
    userRepository,
    adminUser,
  };
}
