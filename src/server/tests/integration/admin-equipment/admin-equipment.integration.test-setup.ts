import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { Equipment } from '../../../src/database/entities/equipment.entity';
import { RoomEquipment } from '../../../src/database/entities/room-equipment.entity';
import { Building } from '../../../src/database/entities/building.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

export interface AdminEquipmentTestContext {
  app: INestApplication;
  userRepository: Repository<User>;
  equipmentRepository: Repository<Equipment>;
  roomEquipmentRepository: Repository<RoomEquipment>;
  buildingRepository: Repository<Building>;
  adminUser: User;
  staffUser: User;
  adminAgent: request.SuperAgentTest;
  staffAgent: request.SuperAgentTest;
}

export async function setupAdminEquipmentTest(): Promise<AdminEquipmentTestContext> {
  const setup = await setupTestAppWithAuth();
  const app = setup.app;
  const userRepository = setup.userRepository;

  // Get DataSource from the app
  const dataSource = app.get(DataSource);
  const equipmentRepository = dataSource.getRepository(Equipment);
  const roomEquipmentRepository = dataSource.getRepository(RoomEquipment);
  const buildingRepository = dataSource.getRepository(Building);

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  let adminUser = userRepository.create({
    email: `admin-equipment-${Date.now()}@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
  });
  adminUser = await userRepository.save(adminUser);

  let staffUser = userRepository.create({
    email: `staff-equipment-${Date.now()}@uvic.ca`,
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

  // Create test building and room for room-equipment tests
  await adminAgent
    .post('/buildings')
    .send({
      short_name: 'EQTEST',
      name: 'Equipment Test Building',
    })
    .expect(201);

  await adminAgent
    .post('/rooms')
    .send({
      building_short_name: 'EQTEST',
      room_number: '101',
      capacity: 30,
      room_type: 'Classroom',
      url: 'https://example.com/eqtest-101',
    })
    .expect(201);

  return {
    app,
    userRepository,
    equipmentRepository,
    roomEquipmentRepository,
    buildingRepository,
    adminUser,
    staffUser,
    adminAgent,
    staffAgent,
  };
}
