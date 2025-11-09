import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { Building } from '../../../src/database/entities/building.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

export interface AdminBuildingsRoomsTestContext {
  app: INestApplication;
  userRepository: Repository<User>;
  buildingRepository: Repository<Building>;
  roomRepository: Repository<Room>;
  adminUser: User;
  staffUser: User;
  adminAgent: request.SuperAgentTest;
  staffAgent: request.SuperAgentTest;
}

export async function setupAdminBuildingsRoomsTests(): Promise<AdminBuildingsRoomsTestContext> {
  const setup = await setupTestAppWithAuth();
  const app = setup.app;
  const userRepository = setup.userRepository;

  // Get DataSource from the app
  const dataSource = app.get(DataSource);
  const buildingRepository = dataSource.getRepository(Building);
  const roomRepository = dataSource.getRepository(Room);

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  let adminUser = userRepository.create({
    email: `admin-buildings-${Date.now()}@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
  });
  adminUser = await userRepository.save(adminUser);

  let staffUser = userRepository.create({
    email: `staff-buildings-${Date.now()}@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Staff',
    last_name: 'User',
    role: UserRole.STAFF,
  });
  staffUser = await userRepository.save(staffUser);

  // Create authenticated agents
  const adminAgent = request.agent(app.getHttpServer());
  await adminAgent
    .post('/api/auth/login')
    .send({ email: adminUser.email, password: 'password123' })
    .expect(200);

  const staffAgent = request.agent(app.getHttpServer());
  await staffAgent
    .post('/api/auth/login')
    .send({ email: staffUser.email, password: 'password123' })
    .expect(200);

  return {
    app,
    userRepository,
    buildingRepository,
    roomRepository,
    adminUser,
    staffUser,
    adminAgent,
    staffAgent,
  };
}
