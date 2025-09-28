// Mock ESM-only module to avoid Jest transform errors
// Must be declared before imports that transitively load it
jest.mock('@auth/express', () => ({
  ExpressAuth: () => (_req: any, _res: any, next: any) => next(),
}));

// Ensure AppModule connects to the dedicated test services
(() => {
  process.env.PGHOST = process.env.PGHOST_TEST || 'localhost';
  process.env.PGPORT = process.env.PGPORT_TEST || '5433';
  process.env.PGUSER = process.env.PGUSER_TEST || 'test';
  process.env.PGPASSWORD = process.env.PGPASSWORD_TEST || 'test';
  process.env.PGDATABASE = process.env.PGDATABASE_TEST || 'test_db';
  process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
  process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
})();

// Increase timeout for DB container startup/sync
jest.setTimeout(30000);

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request, { Response } from 'supertest';
import { Repository } from 'typeorm';

import { User, UserRole } from '../../src/database/entities/user.entity';
import { Building } from '../../src/database/entities/building.entity';
import { Room } from '../../src/database/entities/room.entity';
import { Booking, BookingStatus } from '../../src/database/entities/booking.entity';
import { BookingSeries } from '../../src/database/entities/booking-series.entity';
import { AuditLog } from '../../src/database/entities/audit-log.entity';

// Shared setup function
async function setupTestApp() {
  const { AppModule } = await import('../../src/app/app.module');
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Apply the same validation pipe configuration as in main.ts
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  await app.init();

  return {
    app,
    userRepository: moduleFixture.get<Repository<User>>(getRepositoryToken(User)),
    buildingRepository: moduleFixture.get<Repository<Building>>(getRepositoryToken(Building)),
    roomRepository: moduleFixture.get<Repository<Room>>(getRepositoryToken(Room)),
    bookingRepository: moduleFixture.get<Repository<Booking>>(getRepositoryToken(Booking)),
    bookingSeriesRepository: moduleFixture.get<Repository<BookingSeries>>(getRepositoryToken(BookingSeries)),
    auditLogRepository: moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog)),
  };
}

async function getTestData(buildingRepository: Repository<Building>, roomRepository: Repository<Room>) {
  const testBuilding = await buildingRepository.findOne({ where: {} });
  if (!testBuilding) {
    throw new Error('No buildings found in seed data');
  }

  const testRoom = await roomRepository.findOne({ where: { building_id: testBuilding.id } });
  if (!testRoom) {
    throw new Error('No rooms found in seed data');
  }

  return { testBuilding, testRoom };
}

describe('/users (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    userRepository = setup.userRepository;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST) should create a new user', () => {
    const newUser = {
      email: `newuser-${Date.now()}@uvic.ca`,
      password: 'securePassword123',
      role: UserRole.STAFF,
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(newUser)
      .expect(201)
      .expect((res: Response) => {
        expect(res.body.email).toBe(newUser.email);
        expect(res.body.role).toBe(newUser.role);
        expect(res.body.password).toBeUndefined();
      });
  });

  it('/users (GET) should return all users', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/users/:id (GET) should return a specific user', async () => {
    const testUser = userRepository.create({
      email: `test-get-${Date.now()}@uvic.ca`,
      password_hash: 'hashedPassword',
      role: UserRole.STAFF,
    });
    const savedUser = await userRepository.save(testUser);

    return request(app.getHttpServer())
      .get(`/users/${savedUser.id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.id).toBe(savedUser.id);
        expect(res.body.email).toBe(savedUser.email);
      });
  });

  it('/users/:id (PATCH) should update a user', async () => {
    const testUser = userRepository.create({
      email: `test-patch-${Date.now()}@uvic.ca`,
      password_hash: 'hashedPassword',
      role: UserRole.STAFF,
    });
    const savedUser = await userRepository.save(testUser);
    const updateData = { full_name: 'Updated Test User' };

    return request(app.getHttpServer())
      .patch(`/users/${savedUser.id}`)
      .send(updateData)
      .expect(200)
      .expect((res) => {
        expect(res.body.full_name).toBe(updateData.full_name);
      });
  });
});

describe('/buildings (e2e)', () => {
  let app: INestApplication;
  let buildingRepository: Repository<Building>;
  let testBuilding: Building;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    buildingRepository = setup.buildingRepository;
    
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

  it('/buildings/:id (GET) should return a specific building', () => {
    return request(app.getHttpServer())
      .get(`/buildings/${testBuilding.id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.id).toBe(testBuilding.id);
        expect(res.body.short_name).toBe(testBuilding.short_name);
      });
  });

  it('/buildings/:id/rooms (GET) should return rooms in a building', () => {
    return request(app.getHttpServer())
      .get(`/buildings/${testBuilding.id}/rooms`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].building_id).toBe(testBuilding.id);
      });
  });
});

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
      .get(`/rooms?building_id=${testBuilding.id}&min_capacity=20`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        if (res.body.length > 0) {
          expect(res.body[0].building_id).toBe(testBuilding.id);
          expect(res.body[0].capacity).toBeGreaterThanOrEqual(20);
        }
      });
  });

  it('/rooms/:id (GET) should return a specific room', () => {
    return request(app.getHttpServer())
      .get(`/rooms/${testRoom.id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.id).toBe(testRoom.id);
        expect(res.body.room).toBe(testRoom.room);
      });
  });
});

describe('/bookings (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let bookingRepository: Repository<Booking>;
  let testUser: User;
  let testRoom: Room;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    userRepository = setup.userRepository;
    bookingRepository = setup.bookingRepository;

    // Create test user
    testUser = userRepository.create({
      email: `test-bookings-${Date.now()}@uvic.ca`,
      password_hash: 'hashedPassword',
      role: UserRole.STAFF,
    });
    testUser = await userRepository.save(testUser);

    // Get test room
    const testData = await getTestData(setup.buildingRepository, setup.roomRepository);
    testRoom = testData.testRoom;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/bookings (POST) should create a new booking', () => {
    const newBooking = {
      room_id: testRoom.id,
      start_time: '2026-12-01T09:00:00Z',
      end_time: '2026-12-01T10:00:00Z',
    };

    return request(app.getHttpServer())
      .post(`/bookings?userId=${testUser.id}`)
      .send(newBooking)
      .expect((res: Response) => {
        if (res.status !== 201) {
          console.error('POST /bookings failed:', res.status, res.body);
        }
      })
      .expect(201)
      .expect((res: Response) => {
        expect(res.body.room_id).toBe(newBooking.room_id);
        expect(res.body.user_id).toBe(testUser.id);
        expect(res.body.status).toBe(BookingStatus.ACTIVE);
      });
  });

  it('/bookings (POST) should reject invalid date values', () => {
    const invalidBooking = {
      room_id: testRoom.id,
      start_time: 'invalid-date',
      end_time: '2026-12-01T10:00:00Z',
    };

    return request(app.getHttpServer())
      .post(`/bookings?userId=${testUser.id}`)
      .send(invalidBooking)
      .expect(400);
  });

  it('/bookings (GET) should return all bookings', async () => {
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: new Date('2026-12-01T09:00:00Z'),
      end_time: new Date('2026-12-01T10:00:00Z'),
      status: BookingStatus.ACTIVE,
    });
    await bookingRepository.save(booking);

    return request(app.getHttpServer())
      .get('/bookings')
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/bookings (GET) with filters should filter results', async () => {
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: new Date('2026-12-01T11:00:00Z'),
      end_time: new Date('2026-12-01T12:00:00Z'),
      status: BookingStatus.ACTIVE,
    });
    await bookingRepository.save(booking);

    return request(app.getHttpServer())
      .get(`/bookings?userId=${testUser.id}&roomId=${testRoom.id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        if (res.body.length > 0) {
          expect(res.body[0].user_id).toBe(testUser.id);
          expect(res.body[0].room_id).toBe(testRoom.id);
        }
      });
  });

  it('/bookings/:id (GET) should return a specific booking', async () => {
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: new Date('2026-12-01T13:00:00Z'),
      end_time: new Date('2026-12-01T14:00:00Z'),
      status: BookingStatus.ACTIVE,
    });
    const savedBooking = await bookingRepository.save(booking);

    return request(app.getHttpServer())
      .get(`/bookings/${savedBooking.id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.id).toBe(savedBooking.id);
        expect(res.body.user_id).toBe(testUser.id);
        expect(res.body.room_id).toBe(testRoom.id);
      });
  });

  it('/bookings/:id (PATCH) should update a booking', async () => {
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: new Date('2026-12-01T15:00:00Z'),
      end_time: new Date('2026-12-01T16:00:00Z'),
      status: BookingStatus.ACTIVE,
    });
    const savedBooking = await bookingRepository.save(booking);

    const updateData = {
      start_time: '2026-12-01T16:00:00Z',
      end_time: '2026-12-01T17:00:00Z',
    };

    return request(app.getHttpServer())
      .patch(`/bookings/${savedBooking.id}?userId=${testUser.id}`)
      .send(updateData)
      .expect((res: Response) => {
        if (res.status !== 200) {
          console.error('PATCH /bookings/:id failed:', res.status, res.body);
        }
      })
      .expect(200)
      .expect((res) => {
        expect(new Date(res.body.start_time)).toEqual(new Date(updateData.start_time));
        expect(new Date(res.body.end_time)).toEqual(new Date(updateData.end_time));
      });
  });

  it('/bookings/:id (DELETE) should cancel a booking', async () => {
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: new Date('2026-12-01T17:00:00Z'),
      end_time: new Date('2026-12-01T18:00:00Z'),
      status: BookingStatus.ACTIVE,
    });
    const savedBooking = await bookingRepository.save(booking);

    return request(app.getHttpServer())
      .delete(`/bookings/${savedBooking.id}?userId=${testUser.id}`)
      .expect(204);
  });
});

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
      .get(`/equipment/room/${testRoom.id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
      });
  });

  it('should return 404 for non-existent room', () => {
    const nonExistentRoomId = '00000000-0000-0000-0000-000000000000';
    return request(app.getHttpServer())
      .get(`/equipment/room/${nonExistentRoomId}`)
      .expect(404);
  });
});

describe('Error handling (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let testUser: User;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    userRepository = setup.userRepository;

    testUser = userRepository.create({
      email: `test-errors-${Date.now()}@uvic.ca`,
      password_hash: 'hashedPassword',
      role: UserRole.STAFF,
    });
    testUser = await userRepository.save(testUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 404 for non-existent user', () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    return request(app.getHttpServer())
      .get(`/users/${nonExistentId}`)
      .expect(404);
  });

  it('should return 400 for invalid UUID format', () => {
    const invalidId = 'invalid-uuid';
    return request(app.getHttpServer())
      .get(`/users/${invalidId}`)
      .expect(400);
  });

  it('should return 409 when creating user with existing email', async () => {
    const existingUser = {
      email: testUser.email,
      password: 'securePassword123',
      role: UserRole.STAFF,
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(existingUser)
      .expect(409);
  });
});