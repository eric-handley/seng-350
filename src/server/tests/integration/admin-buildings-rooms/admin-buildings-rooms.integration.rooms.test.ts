import request from 'supertest';
import { Repository } from 'typeorm';

import { Room } from '../../../src/database/entities/room.entity';
import { Building } from '../../../src/database/entities/building.entity';
import { setupAdminBuildingsRoomsTests } from './admin-buildings-rooms.integration.test-setup';

describe('Admin Buildings & Rooms Management - Rooms CRUD (e2e)', () => {
  let roomRepository: Repository<Room>;
  let buildingRepository: Repository<Building>;
  let adminAgent: request.SuperAgentTest;
  let staffAgent: request.SuperAgentTest;
  let app: any;

  beforeAll(async () => {
    const setup = await setupAdminBuildingsRoomsTests();
    app = setup.app;
    roomRepository = setup.roomRepository;
    buildingRepository = setup.buildingRepository;
    adminAgent = setup.adminAgent;
    staffAgent = setup.staffAgent;

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
    await app.close();
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
