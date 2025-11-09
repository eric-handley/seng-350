import request from 'supertest';
import { Repository } from 'typeorm';

import { Building } from '../../../src/database/entities/building.entity';
import { setupAdminBuildingsRoomsTests } from './admin-buildings-rooms.integration.test-setup';

describe('Admin Buildings & Rooms Management - Buildings CRUD (e2e)', () => {
  let buildingRepository: Repository<Building>;
  let adminAgent: request.SuperAgentTest;
  let staffAgent: request.SuperAgentTest;
  let app: any;

  beforeAll(async () => {
    const setup = await setupAdminBuildingsRoomsTests();
    app = setup.app;
    buildingRepository = setup.buildingRepository;
    adminAgent = setup.adminAgent;
    staffAgent = setup.staffAgent;
  });

  afterAll(async () => {
    await app.close();
  });

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
