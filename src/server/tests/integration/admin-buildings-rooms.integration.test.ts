import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../src/database/entities/user.entity';
import { Building } from '../../src/database/entities/building.entity';
import { Room } from '../../src/database/entities/room.entity';
import { setupTestAppWithAuth } from './auth-test-helpers';

describe('Admin Buildings & Rooms Management (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let buildingRepository: Repository<Building>;
  let roomRepository: Repository<Room>;
  let adminUser: User;
  let staffUser: User;
  let adminAgent: request.SuperAgentTest;
  let staffAgent: request.SuperAgentTest;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    // Get DataSource from the app
    const dataSource = app.get(DataSource);
    buildingRepository = dataSource.getRepository(Building);
    roomRepository = dataSource.getRepository(Room);

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    adminUser = userRepository.create({
      email: `admin-buildings-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);

    staffUser = userRepository.create({
      email: `staff-buildings-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    staffUser = await userRepository.save(staffUser);

    // Create authenticated agents
    adminAgent = request.agent(app.getHttpServer());
    await adminAgent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    staffAgent = request.agent(app.getHttpServer());
    await staffAgent
      .post('/api/auth/login')
      .send({ email: staffUser.email, password: 'password123' })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Buildings CRUD', () => {
    describe('POST /buildings - Create building', () => {
      it('should create a new building as admin', async () => {
        const response = await adminAgent
          .post('/buildings')
          .send({
            short_name: 'TEST',
            name: 'Test Building',
          })
          .expect(201);

        expect(response.body).toMatchObject({
          short_name: 'TEST',
          name: 'Test Building',
        });
        expect(response.body.created_at).toBeDefined();
        expect(response.body.updated_at).toBeDefined();

        // Cleanup
        await buildingRepository.delete({ short_name: 'TEST' });
      });

      it('should reject building creation as staff', async () => {
        const response = await staffAgent
          .post('/buildings')
          .send({
            short_name: 'FAIL',
            name: 'Should Fail',
          })
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');
      });

      it('should reject duplicate building short_name', async () => {
        // Create first building
        await adminAgent
          .post('/buildings')
          .send({
            short_name: 'DUP',
            name: 'Duplicate Test',
          })
          .expect(201);

        // Try to create duplicate
        const response = await adminAgent
          .post('/buildings')
          .send({
            short_name: 'DUP',
            name: 'Another Name',
          })
          .expect(409);

        expect(response.body.message).toBe('Building with this short name already exists');

        // Cleanup
        await buildingRepository.delete({ short_name: 'DUP' });
      });
    });

    describe('PATCH /buildings/:short_name - Update building', () => {
      beforeEach(async () => {
        await adminAgent
          .post('/buildings')
          .send({
            short_name: 'UPD',
            name: 'Original Name',
          })
          .expect(201);
      });

      afterEach(async () => {
        await buildingRepository.delete({ short_name: 'UPD' });
      });

      it('should update building name as admin', async () => {
        const response = await adminAgent
          .patch('/buildings/UPD')
          .send({
            name: 'Updated Test Building',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          short_name: 'UPD',
          name: 'Updated Test Building',
        });
      });

      it('should reject building update as staff', async () => {
        const response = await staffAgent
          .patch('/buildings/UPD')
          .send({
            name: 'Should Fail',
          })
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');
      });

      it('should return 404 for non-existent building', async () => {
        const response = await adminAgent
          .patch('/buildings/NOTFOUND')
          .send({
            name: 'Does Not Exist',
          })
          .expect(404);

        expect(response.body.message).toBe('Building not found');
      });
    });

    describe('DELETE /buildings/:short_name - Delete building', () => {
      it('should delete empty building as admin', async () => {
        // Create building
        await adminAgent
          .post('/buildings')
          .send({
            short_name: 'DEL',
            name: 'Delete Test',
          })
          .expect(201);

        // Delete building
        await adminAgent
          .delete('/buildings/DEL')
          .expect(204);

        // Verify deletion
        const response = await adminAgent
          .get('/buildings/DEL')
          .expect(404);

        expect(response.body.message).toBe('Building not found');
      });

      it('should reject building deletion as staff', async () => {
        // Create building
        await adminAgent
          .post('/buildings')
          .send({
            short_name: 'DELSTAFF',
            name: 'Delete Test Staff',
          })
          .expect(201);

        // Try to delete as staff
        const response = await staffAgent
          .delete('/buildings/DELSTAFF')
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');

        // Cleanup
        await buildingRepository.delete({ short_name: 'DELSTAFF' });
      });

      it('should return 404 for non-existent building', async () => {
        const response = await adminAgent
          .delete('/buildings/NOTFOUND')
          .expect(404);

        expect(response.body.message).toBe('Building not found');
      });
    });
  });

  describe('Rooms CRUD', () => {
    beforeAll(async () => {
      // Create a test building for room tests
      await adminAgent
        .post('/buildings')
        .send({
          short_name: 'RTEST',
          name: 'Room Test Building',
        })
        .expect(201);
    });

    afterAll(async () => {
      // Clean up test building (will cascade delete rooms)
      await buildingRepository.delete({ short_name: 'RTEST' });
    });

    describe('POST /rooms - Create room', () => {
      it('should create a new room as admin', async () => {
        const response = await adminAgent
          .post('/rooms')
          .send({
            building_short_name: 'RTEST',
            room_number: '101',
            capacity: 30,
            room_type: 'Classroom',
            url: 'https://example.com/rtest-101',
          })
          .expect(201);

        expect(response.body).toMatchObject({
          room_id: 'RTEST-101',
          building_short_name: 'RTEST',
          room_number: '101',
          capacity: 30,
          room_type: 'Classroom',
          url: 'https://example.com/rtest-101',
        });
        expect(response.body.building).toMatchObject({
          short_name: 'RTEST',
          name: 'Room Test Building',
        });

        // Cleanup
        await roomRepository.delete({ room_id: 'RTEST-101' });
      });

      it('should reject room creation as staff', async () => {
        const response = await staffAgent
          .post('/rooms')
          .send({
            building_short_name: 'RTEST',
            room_number: '999',
            capacity: 30,
            room_type: 'Classroom',
            url: 'https://example.com/fail',
          })
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');
      });

      it('should reject room creation for non-existent building', async () => {
        const response = await adminAgent
          .post('/rooms')
          .send({
            building_short_name: 'NOTEXIST',
            room_number: '101',
            capacity: 30,
            room_type: 'Classroom',
            url: 'https://example.com/fail',
          })
          .expect(404);

        expect(response.body.message).toBe('Building not found');
      });

      it('should reject duplicate room', async () => {
        // Create first room
        await adminAgent
          .post('/rooms')
          .send({
            building_short_name: 'RTEST',
            room_number: '202',
            capacity: 30,
            room_type: 'Classroom',
            url: 'https://example.com/rtest-202',
          })
          .expect(201);

        // Try to create duplicate
        const response = await adminAgent
          .post('/rooms')
          .send({
            building_short_name: 'RTEST',
            room_number: '202',
            capacity: 50,
            room_type: 'Lecture theatre',
            url: 'https://example.com/duplicate',
          })
          .expect(409);

        expect(response.body.message).toBe('Room already exists');

        // Cleanup
        await roomRepository.delete({ room_id: 'RTEST-202' });
      });
    });

    describe('PATCH /rooms/:room_id - Update room', () => {
      beforeEach(async () => {
        await adminAgent
          .post('/rooms')
          .send({
            building_short_name: 'RTEST',
            room_number: '303',
            capacity: 30,
            room_type: 'Classroom',
            url: 'https://example.com/rtest-303',
          })
          .expect(201);
      });

      afterEach(async () => {
        await roomRepository.delete({ room_id: 'RTEST-303' });
      });

      it('should update room properties as admin', async () => {
        const response = await adminAgent
          .patch('/rooms/RTEST-303')
          .send({
            capacity: 50,
            room_type: 'Lecture theatre',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          room_id: 'RTEST-303',
          capacity: 50,
          room_type: 'Lecture theatre',
          url: 'https://example.com/rtest-303', // Unchanged
        });
      });

      it('should reject room update as staff', async () => {
        const response = await staffAgent
          .patch('/rooms/RTEST-303')
          .send({
            capacity: 100,
          })
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');
      });

      it('should return 404 for non-existent room', async () => {
        const response = await adminAgent
          .patch('/rooms/NOTFOUND-999')
          .send({
            capacity: 100,
          })
          .expect(404);

        expect(response.body.message).toBe('Room not found');
      });
    });

    describe('DELETE /rooms/:room_id - Delete room', () => {
      it('should delete room as admin', async () => {
        // Create room
        await adminAgent
          .post('/rooms')
          .send({
            building_short_name: 'RTEST',
            room_number: '404',
            capacity: 30,
            room_type: 'Classroom',
            url: 'https://example.com/rtest-404',
          })
          .expect(201);

        // Delete room
        await adminAgent
          .delete('/rooms/RTEST-404')
          .expect(204);

        // Verify deletion
        const response = await adminAgent
          .get('/rooms/RTEST-404')
          .expect(404);

        expect(response.body.message).toBe('Room not found');
      });

      it('should reject room deletion as staff', async () => {
        // Create room
        await adminAgent
          .post('/rooms')
          .send({
            building_short_name: 'RTEST',
            room_number: '505',
            capacity: 30,
            room_type: 'Classroom',
            url: 'https://example.com/rtest-505',
          })
          .expect(201);

        // Try to delete as staff
        const response = await staffAgent
          .delete('/rooms/RTEST-505')
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');

        // Cleanup
        await roomRepository.delete({ room_id: 'RTEST-505' });
      });

      it('should return 404 for non-existent room', async () => {
        const response = await adminAgent
          .delete('/rooms/NOTFOUND-999')
          .expect(404);

        expect(response.body.message).toBe('Room not found');
      });
    });
  });

  describe('Cascade Delete Behavior', () => {
    it('should cascade delete rooms when building is deleted', async () => {
      // Create building
      await adminAgent
        .post('/buildings')
        .send({
          short_name: 'CASCADE',
          name: 'Cascade Test Building',
        })
        .expect(201);

      // Create room in building
      await adminAgent
        .post('/rooms')
        .send({
          building_short_name: 'CASCADE',
          room_number: '999',
          capacity: 10,
          room_type: 'Classroom',
          url: 'https://example.com/cascade-999',
        })
        .expect(201);

      // Verify room exists
      await adminAgent
        .get('/rooms/CASCADE-999')
        .expect(200);

      // Delete building
      await adminAgent
        .delete('/buildings/CASCADE')
        .expect(204);

      // Verify room was cascade deleted
      const response = await adminAgent
        .get('/rooms/CASCADE-999')
        .expect(404);

      expect(response.body.message).toBe('Room not found');
    });
  });
});
