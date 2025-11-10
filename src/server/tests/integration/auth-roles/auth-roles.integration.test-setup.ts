import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

export interface AuthRolesTestContext {
  app: INestApplication;
  userRepository: Repository<User>;
  staffUser: User;
  adminUser: User;
}

export async function setupAuthRolesTests(): Promise<AuthRolesTestContext> {
  const setup = await setupTestAppWithAuth();
  const app = setup.app;
  const userRepository = setup.userRepository;

  const hashedPassword = await bcrypt.hash('password123', 10);

  let staffUser = userRepository.create({
    email: `authz-staff-${Date.now()}@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Staff',
    last_name: 'User',
    role: UserRole.STAFF,
  });
  staffUser = await userRepository.save(staffUser);

  let adminUser = userRepository.create({
    email: `authz-admin-${Date.now()}@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
  });
  adminUser = await userRepository.save(adminUser);

  return {
    app,
    userRepository,
    staffUser,
    adminUser,
  };
}
