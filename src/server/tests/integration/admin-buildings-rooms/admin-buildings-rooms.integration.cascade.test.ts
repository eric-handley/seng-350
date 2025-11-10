import request from 'supertest';
import { INestApplication } from '@nestjs/common';

import { setupAdminBuildingsRoomsTests } from './admin-buildings-rooms.integration.test-setup';

describe('Admin Buildings & Rooms Management - Cascade Delete Behavior (e2e)', () => {
  let adminAgent: request.SuperAgentTest;
  let app: INestApplication;

  beforeAll(async () => {
    const setup = await setupAdminBuildingsRoomsTests();
    app = setup.app;
    adminAgent = setup.adminAgent;
  });

  afterAll(async () => {
    await app.close();
  });

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
