import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';

import { Room } from '../../../src/database/entities/room.entity';
import { setupTestApp, getTestData } from './api.integration.test-setup';

describe('/equipment/room/:roomId (e2e)', () => {
  let app: INestApplication;
  let testRoom: Room;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;

    const testData = await getTestData(setup.buildingRepository, setup.roomRepository);
    testRoom = testData.testRoom;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return equipment for a specific room', () => {
    return request(app.getHttpServer())
      .get(`/equipment/room/${testRoom.room_id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
      });
  });

  it('should return 404 for non-existent room', () => {
    const nonExistentRoomId = 'NONEXISTENT-999';
    return request(app.getHttpServer())
      .get(`/equipment/room/${nonExistentRoomId}`)
      .expect(404);
  });
});
