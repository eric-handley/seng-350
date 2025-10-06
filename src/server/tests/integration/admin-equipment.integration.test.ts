import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository, DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../src/database/entities/user.entity';
import { Equipment } from '../../src/database/entities/equipment.entity';
import { RoomEquipment } from '../../src/database/entities/room-equipment.entity';
import { Building } from '../../src/database/entities/building.entity';
import { setupTestAppWithAuth } from './auth-test-helpers';

describe('Admin Equipment & Room-Equipment Management (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let equipmentRepository: Repository<Equipment>;
  let roomEquipmentRepository: Repository<RoomEquipment>;
  let buildingRepository: Repository<Building>;
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
    equipmentRepository = dataSource.getRepository(Equipment);
    roomEquipmentRepository = dataSource.getRepository(RoomEquipment);
    buildingRepository = dataSource.getRepository(Building);

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    adminUser = userRepository.create({
      email: `admin-equipment-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);

    staffUser = userRepository.create({
      email: `staff-equipment-${Date.now()}@uvic.ca`,
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
  });

  afterAll(async () => {
    // Clean up test building (will cascade delete room and room_equipment)
    await buildingRepository.delete({ short_name: 'EQTEST' });
    await app.close();
  });

  describe('Equipment CRUD', () => {
    describe('POST /equipment - Create equipment', () => {
      it('should create new equipment as admin', async () => {
        const response = await adminAgent
          .post('/equipment')
          .send({
            name: 'Test Projector',
          })
          .expect(201);

        expect(response.body).toMatchObject({
          name: 'Test Projector',
        });
        expect(response.body.id).toBeDefined();
        expect(response.body.created_at).toBeDefined();
        expect(response.body.updated_at).toBeDefined();

        // Cleanup
        await equipmentRepository.delete({ id: response.body.id });
      });

      it('should reject equipment creation as staff', async () => {
        const response = await staffAgent
          .post('/equipment')
          .send({
            name: 'Should Fail',
          })
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');
      });

      it('should reject duplicate equipment name', async () => {
        // Create first equipment
        const firstResponse = await adminAgent
          .post('/equipment')
          .send({
            name: 'Duplicate Equipment',
          })
          .expect(201);

        // Try to create duplicate
        const response = await adminAgent
          .post('/equipment')
          .send({
            name: 'Duplicate Equipment',
          })
          .expect(409);

        expect(response.body.message).toBe("Equipment with name 'Duplicate Equipment' already exists");

        // Cleanup
        await equipmentRepository.delete({ id: firstResponse.body.id });
      });

      it('should reject empty name', async () => {
        await adminAgent
          .post('/equipment')
          .send({
            name: '',
          })
          .expect(400);
      });
    });

    describe('PATCH /equipment/:id - Update equipment', () => {
      let equipmentId: string;

      beforeEach(async () => {
        const response = await adminAgent
          .post('/equipment')
          .send({
            name: 'Original Equipment Name',
          })
          .expect(201);
        equipmentId = response.body.id;
      });

      afterEach(async () => {
        await equipmentRepository.delete({ id: equipmentId });
      });

      it('should update equipment name as admin', async () => {
        const response = await adminAgent
          .patch(`/equipment/${equipmentId}`)
          .send({
            name: 'Updated Equipment Name',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          id: equipmentId,
          name: 'Updated Equipment Name',
        });
      });

      it('should reject equipment update as staff', async () => {
        const response = await staffAgent
          .patch(`/equipment/${equipmentId}`)
          .send({
            name: 'Should Fail',
          })
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');
      });

      it('should return 404 for non-existent equipment', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await adminAgent
          .patch(`/equipment/${fakeId}`)
          .send({
            name: 'Does Not Exist',
          })
          .expect(404);

        expect(response.body.message).toBe(`Equipment with ID ${fakeId} not found`);
      });

      it('should reject duplicate name when updating', async () => {
        // Create another equipment
        const otherResponse = await adminAgent
          .post('/equipment')
          .send({
            name: 'Other Equipment',
          })
          .expect(201);

        // Try to update to duplicate name
        const response = await adminAgent
          .patch(`/equipment/${equipmentId}`)
          .send({
            name: 'Other Equipment',
          })
          .expect(409);

        expect(response.body.message).toBe("Equipment with name 'Other Equipment' already exists");

        // Cleanup
        await equipmentRepository.delete({ id: otherResponse.body.id });
      });
    });

    describe('DELETE /equipment/:id - Delete equipment', () => {
      it('should delete equipment as admin', async () => {
        // Create equipment
        const createResponse = await adminAgent
          .post('/equipment')
          .send({
            name: 'To Be Deleted',
          })
          .expect(201);

        const equipmentId = createResponse.body.id;

        // Delete equipment
        await adminAgent
          .delete(`/equipment/${equipmentId}`)
          .expect(204);

        // Verify deletion
        const equipment = await equipmentRepository.findOne({ where: { id: equipmentId } });
        expect(equipment).toBeNull();
      });

      it('should reject equipment deletion as staff', async () => {
        // Create equipment
        const createResponse = await adminAgent
          .post('/equipment')
          .send({
            name: 'Staff Cannot Delete',
          })
          .expect(201);

        const equipmentId = createResponse.body.id;

        // Try to delete as staff
        const response = await staffAgent
          .delete(`/equipment/${equipmentId}`)
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');

        // Cleanup
        await equipmentRepository.delete({ id: equipmentId });
      });

      it('should return 404 for non-existent equipment', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await adminAgent
          .delete(`/equipment/${fakeId}`)
          .expect(404);

        expect(response.body.message).toBe(`Equipment with ID ${fakeId} not found`);
      });

      it('should cascade delete room-equipment relationships', async () => {
        // Create equipment
        const createResponse = await adminAgent
          .post('/equipment')
          .send({
            name: `Cascade Test Equipment ${Date.now()}`,
          })
          .expect(201);

        const equipmentId = createResponse.body.id;

        // Add equipment to room
        await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: equipmentId,
            quantity: 5,
          })
          .expect(201);

        // Verify room-equipment exists
        const roomEquipmentBefore = await roomEquipmentRepository.findOne({
          where: { room_id: 'EQTEST-101', equipment_id: equipmentId },
        });
        expect(roomEquipmentBefore).toBeDefined();

        // Delete equipment
        await adminAgent
          .delete(`/equipment/${equipmentId}`)
          .expect(204);

        // Verify room-equipment was cascade deleted
        const roomEquipmentAfter = await roomEquipmentRepository.findOne({
          where: { room_id: 'EQTEST-101', equipment_id: equipmentId },
        });
        expect(roomEquipmentAfter).toBeNull();
      });
    });
  });

  describe('Room-Equipment CRUD', () => {
    let equipmentId: string;

    beforeAll(async () => {
      // Create equipment for room-equipment tests
      const response = await adminAgent
        .post('/equipment')
        .send({
          name: 'Room Equipment Test Item',
        })
        .expect(201);
      equipmentId = response.body.id;
    });

    afterAll(async () => {
      // Cleanup equipment
      await equipmentRepository.delete({ id: equipmentId });
    });

    describe('POST /room-equipment - Add equipment to room', () => {
      it('should add equipment to room as admin', async () => {
        const response = await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: equipmentId,
            quantity: 3,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 3,
        });
        expect(response.body.created_at).toBeDefined();
        expect(response.body.updated_at).toBeDefined();

        // Cleanup
        await roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
      });

      it('should add equipment to room without quantity', async () => {
        const response = await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: equipmentId,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: null,
        });

        // Cleanup
        await roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
      });

      it('should reject adding equipment as staff', async () => {
        const response = await staffAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: equipmentId,
            quantity: 1,
          })
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');
      });

      it('should reject non-existent room', async () => {
        const response = await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'NOTFOUND-999',
            equipment_id: equipmentId,
            quantity: 1,
          })
          .expect(404);

        expect(response.body.message).toBe('Room with ID NOTFOUND-999 not found');
      });

      it('should reject non-existent equipment', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: fakeId,
            quantity: 1,
          })
          .expect(404);

        expect(response.body.message).toBe(`Equipment with ID ${fakeId} not found`);
      });

      it('should reject duplicate room-equipment relationship', async () => {
        // Create first relationship
        await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: equipmentId,
            quantity: 2,
          })
          .expect(201);

        // Try to create duplicate
        const response = await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: equipmentId,
            quantity: 5,
          })
          .expect(409);

        expect(response.body.message).toBe(
          `Equipment ${equipmentId} already exists in room EQTEST-101`
        );

        // Cleanup
        await roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
      });

      it('should reject invalid quantity (less than 1)', async () => {
        await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: equipmentId,
            quantity: 0,
          })
          .expect(400);
      });
    });

    describe('PATCH /room-equipment/:room_id/:equipment_id - Update room-equipment', () => {
      beforeEach(async () => {
        await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: equipmentId,
            quantity: 2,
          })
          .expect(201);
      });

      afterEach(async () => {
        await roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
      });

      it('should update quantity as admin', async () => {
        const response = await adminAgent
          .patch(`/room-equipment/EQTEST-101/${equipmentId}`)
          .send({
            quantity: 10,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          room_id: 'EQTEST-101',
          equipment_id: equipmentId,
          quantity: 10,
        });
      });

      it('should reject update as staff', async () => {
        const response = await staffAgent
          .patch(`/room-equipment/EQTEST-101/${equipmentId}`)
          .send({
            quantity: 20,
          })
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');
      });

      it('should return 404 for non-existent relationship', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await adminAgent
          .patch(`/room-equipment/EQTEST-101/${fakeId}`)
          .send({
            quantity: 5,
          })
          .expect(404);

        expect(response.body.message).toBe(
          `Room-Equipment relationship not found for room EQTEST-101 and equipment ${fakeId}`
        );
      });

      it('should reject invalid quantity', async () => {
        await adminAgent
          .patch(`/room-equipment/EQTEST-101/${equipmentId}`)
          .send({
            quantity: -1,
          })
          .expect(400);
      });
    });

    describe('DELETE /room-equipment/:room_id/:equipment_id - Remove equipment from room', () => {
      beforeEach(async () => {
        await adminAgent
          .post('/room-equipment')
          .send({
            room_id: 'EQTEST-101',
            equipment_id: equipmentId,
            quantity: 3,
          })
          .expect(201);
      });

      it('should remove equipment from room as admin', async () => {
        await adminAgent
          .delete(`/room-equipment/EQTEST-101/${equipmentId}`)
          .expect(204);

        // Verify deletion
        const roomEquipment = await roomEquipmentRepository.findOne({
          where: { room_id: 'EQTEST-101', equipment_id: equipmentId },
        });
        expect(roomEquipment).toBeNull();
      });

      it('should reject removal as staff', async () => {
        const response = await staffAgent
          .delete(`/room-equipment/EQTEST-101/${equipmentId}`)
          .expect(403);

        expect(response.body.message).toBe('Forbidden resource');

        // Cleanup
        await roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
      });

      it('should return 404 for non-existent relationship', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await adminAgent
          .delete(`/room-equipment/EQTEST-101/${fakeId}`)
          .expect(404);

        expect(response.body.message).toBe(
          `Room-Equipment relationship not found for room EQTEST-101 and equipment ${fakeId}`
        );

        // Cleanup
        await roomEquipmentRepository.delete({ room_id: 'EQTEST-101', equipment_id: equipmentId });
      });
    });
  });

  describe('Cascade Delete Behavior', () => {
    it('should cascade delete room-equipment when room is deleted', async () => {
      // Create equipment
      const equipmentResponse = await adminAgent
        .post('/equipment')
        .send({
          name: `Cascade Room Delete Test ${Date.now()}`,
        })
        .expect(201);

      const equipmentId = equipmentResponse.body.id;

      // Create room
      await adminAgent
        .post('/rooms')
        .send({
          building_short_name: 'EQTEST',
          room_number: '999',
          capacity: 10,
          room_type: 'Classroom',
          url: 'https://example.com/cascade-999',
        })
        .expect(201);

      // Add equipment to room
      await adminAgent
        .post('/room-equipment')
        .send({
          room_id: 'EQTEST-999',
          equipment_id: equipmentId,
          quantity: 1,
        })
        .expect(201);

      // Verify room-equipment exists
      const roomEquipmentBefore = await roomEquipmentRepository.findOne({
        where: { room_id: 'EQTEST-999', equipment_id: equipmentId },
      });
      expect(roomEquipmentBefore).toBeDefined();

      // Delete room
      await adminAgent
        .delete('/rooms/EQTEST-999')
        .expect(204);

      // Verify room-equipment was cascade deleted
      const roomEquipmentAfter = await roomEquipmentRepository.findOne({
        where: { room_id: 'EQTEST-999', equipment_id: equipmentId },
      });
      expect(roomEquipmentAfter).toBeNull();

      // Equipment should still exist
      const equipment = await equipmentRepository.findOne({ where: { id: equipmentId } });
      expect(equipment).toBeDefined();

      // Cleanup
      await equipmentRepository.delete({ id: equipmentId });
    });
  });
});
