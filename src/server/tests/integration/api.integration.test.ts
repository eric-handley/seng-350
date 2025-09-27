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
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request, { Response } from 'supertest';
import { Repository } from 'typeorm';

import { User, UserRole } from '../../src/database/entities/user.entity';
import { Building } from '../../src/database/entities/building.entity';
import { Room, RoomType } from '../../src/database/entities/room.entity';
import { Booking, BookingStatus } from '../../src/database/entities/booking.entity';
import { Equipment } from '../../src/database/entities/equipment.entity';

describe('API Integration Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let buildingRepository: Repository<Building>;
  let roomRepository: Repository<Room>;
  let bookingRepository: Repository<Booking>;
  let equipmentRepository: Repository<Equipment>;

  let testUser: User;
  let testBuilding: Building;
  let testRoom: Room;
  let testEquipment: Equipment;

  beforeAll(async () => {
    // Dynamically import AppModule after env configured above
    const { AppModule } = await import('../../src/app/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    buildingRepository = moduleFixture.get<Repository<Building>>(getRepositoryToken(Building));
    roomRepository = moduleFixture.get<Repository<Room>>(getRepositoryToken(Room));
    bookingRepository = moduleFixture.get<Repository<Booking>>(getRepositoryToken(Booking));
    equipmentRepository = moduleFixture.get<Repository<Equipment>>(getRepositoryToken(Equipment));

    await setupTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up bookings after each test
    await bookingRepository.clear();
  });

  async function setupTestData() {
    // Create test user
    testUser = userRepository.create({
      email: 'test@uvic.ca',
      password_hash: 'hashedPassword',
      role: UserRole.STAFF,
    });
    testUser = await userRepository.save(testUser);

    // Create test building
    testBuilding = buildingRepository.create({
      short_name: 'ELW',
      name: 'Elliott Building',
    });
    testBuilding = await buildingRepository.save(testBuilding);

    // Create test room
    testRoom = roomRepository.create({
      room: '101',
      building: testBuilding,
      capacity: 30,
      room_type: RoomType.CLASSROOM,
      url: 'https://example.com/ELW/101',
    });
    testRoom = await roomRepository.save(testRoom);

    // Create test equipment
    testEquipment = equipmentRepository.create({
      name: 'Projector',
    });
    testEquipment = await equipmentRepository.save(testEquipment);
  }

  describe('/users (e2e)', () => {
    it('/users (GET) should return all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('/users (POST) should create a new user', () => {
      const newUser = {
        email: 'newuser@uvic.ca',
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
          expect(res.body.password).toBeUndefined(); // Password should not be returned
        });
    });

    it('/users/:id (GET) should return a specific user', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .expect(200)
        .expect((res: Response) => {
          expect(res.body.id).toBe(testUser.id);
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('/users/:id (PATCH) should update a user', () => {
      const updateData = { full_name: 'Updated Test User' };

      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.full_name).toBe(updateData.full_name);
        });
    });
  });

  describe('/buildings (e2e)', () => {
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
    it('/bookings (POST) should create a new booking', () => {
      const newBooking = {
        room_id: testRoom.id,
        start_time: '2024-12-01T09:00:00Z',
        end_time: '2024-12-01T10:00:00Z',
      };

      return request(app.getHttpServer())
        .post(`/bookings?userId=${testUser.id}`)
        .send(newBooking)
        .expect(201)
        .expect((res: Response) => {
          expect(res.body.room_id).toBe(newBooking.room_id);
          expect(res.body.user_id).toBe(testUser.id);
          expect(res.body.status).toBe(BookingStatus.ACTIVE);
        });
    });

    it('/bookings (GET) should return all bookings', async () => {
      // Create a test booking first
      const booking = bookingRepository.create({
        user: testUser,
        room: testRoom,
        start_time: new Date('2024-12-01T09:00:00Z'),
        end_time: new Date('2024-12-01T10:00:00Z'),
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
      // Create a test booking first
      const booking = bookingRepository.create({
        user: testUser,
        room: testRoom,
        start_time: new Date('2024-12-01T09:00:00Z'),
        end_time: new Date('2024-12-01T10:00:00Z'),
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
        start_time: new Date('2024-12-01T09:00:00Z'),
        end_time: new Date('2024-12-01T10:00:00Z'),
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
        start_time: new Date('2024-12-01T09:00:00Z'),
        end_time: new Date('2024-12-01T10:00:00Z'),
        status: BookingStatus.ACTIVE,
      });
      const savedBooking = await bookingRepository.save(booking);

      const updateData = {
        start_time: '2024-12-01T10:00:00Z',
        end_time: '2024-12-01T11:00:00Z',
      };

      return request(app.getHttpServer())
        .patch(`/bookings/${savedBooking.id}?userId=${testUser.id}`)
        .send(updateData)
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
        start_time: new Date('2024-12-01T09:00:00Z'),
        end_time: new Date('2024-12-01T10:00:00Z'),
        status: BookingStatus.ACTIVE,
      });
      const savedBooking = await bookingRepository.save(booking);

      return request(app.getHttpServer())
        .delete(`/bookings/${savedBooking.id}?userId=${testUser.id}`)
        .expect(204);
    });
  });

  describe('/equipment/room/:roomId (e2e)', () => {
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
        email: testUser.email, // Use existing email
        password: 'securePassword123',
        role: UserRole.STAFF,
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(existingUser)
        .expect(409);
    });
  });
});
