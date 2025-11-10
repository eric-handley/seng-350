import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';

import { Building } from '../../../src/database/entities/building.entity';
import { setupTestApp, getTestData } from './api.integration.test-setup';

describe('/buildings (e2e)', () => {
  let app: INestApplication;
  let testBuilding: Building;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;

    const testData = await getTestData(setup.buildingRepository, setup.roomRepository);
    testBuilding = testData.testBuilding;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/buildings (GET) should return all buildings', () => {
    return request(app.getHttpServer())
      .get('/buildings')
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/buildings/:short_name (GET) should return a specific building', () => {
    return request(app.getHttpServer())
      .get(`/buildings/${testBuilding.short_name}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.short_name).toBe(testBuilding.short_name);
        expect(res.body.name).toBe(testBuilding.name);
      });
  });

  it('/buildings/:short_name/rooms (GET) should return rooms in a building', () => {
    return request(app.getHttpServer())
      .get(`/buildings/${testBuilding.short_name}/rooms`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].building_short_name).toBe(testBuilding.short_name);
      });
  });
});
