import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';

import { Building } from '../../../src/database/entities/building.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { setupTestApp, getTestData } from './api.integration.test-setup';

describe('/rooms (e2e)', () => {
  let app: INestApplication;
  let testBuilding: Building;
  let testRoom: Room;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;

    const testData = await getTestData(setup.buildingRepository, setup.roomRepository);
    testBuilding = testData.testBuilding;
    testRoom = testData.testRoom;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/rooms (GET) should return all rooms', () => {
    return request(app.getHttpServer())
      .get('/rooms')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/rooms (GET) with filters should filter results', () => {
    return request(app.getHttpServer())
      .get(`/rooms?building_short_name=${testBuilding.short_name}&min_capacity=20`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        if (res.body.length > 0) {
          expect(res.body[0].building_short_name).toBe(testBuilding.short_name);
          expect(res.body[0].capacity).toBeGreaterThanOrEqual(20);
        }
      });
  });

  it('/rooms/:room_id (GET) should return a specific room', () => {
    return request(app.getHttpServer())
      .get(`/rooms/${testRoom.room_id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.room_id).toBe(testRoom.room_id);
        expect(res.body.room_number).toBe(testRoom.room_number);
      });
  });
});
