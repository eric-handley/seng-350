import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import request, { Response } from 'supertest';
import { addDays, set } from 'date-fns';
import { Request, Response as ExpressResponse, NextFunction } from 'express';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { Booking, BookingStatus } from '../../../src/database/entities/booking.entity';
import { setupTestApp, getTestData } from './api.integration.test-setup';

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
      id: `00000000-0000-0000-0000-000000000000`,
      email: `test-bookings-${Date.now()}@uvic.ca`,
      password_hash: 'hashedPassword',
      first_name: 'John',
      last_name: 'Doe',
      role: UserRole.STAFF,
    });
    testUser = await userRepository.save(testUser);

    // Get test room
    const testData = await getTestData(setup.buildingRepository, setup.roomRepository);
    testRoom = testData.testRoom;

    // Update middleware to use testUser for this test suite
    app.use((req: Request, _res: ExpressResponse, next: NextFunction) => {
      req.user = {
        id: testUser.id,
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        role: testUser.role,
      };
      next();
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await bookingRepository.clear();
  });
  it('/bookings (POST) should create a new booking', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const newBooking = {
      room_id: testRoom.room_id,
      start_time: futureDate.toISOString(),
      end_time: new Date(futureDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
    };

    return request(app.getHttpServer())
      .post('/bookings')
      .send(newBooking)
      .expect((res: Response) => {
        if (res.status !== 201) {
          console.error('POST /bookings failed:', res.status, res.body);
        }
      })
      .expect(201)
      .expect((res: Response) => {
        expect(res.body.room_id).toBe(newBooking.room_id);
        // User ID will be set from the test middleware (test-user-id)
        expect(res.body.user_id).toBeDefined();
        expect(res.body.status).toBe(BookingStatus.ACTIVE);
      });
  });

  it('/bookings (POST) should reject invalid date values', () => {
    const invalidBooking = {
      room_id: testRoom.room_id,
      start_time: 'invalid-date',
      end_time: '2026-12-01T10:00:00Z',
    };

    return request(app.getHttpServer())
      .post('/bookings')
      .send(invalidBooking)
      .expect(400);
  });

  it('/bookings (GET) should return all bookings', async () => {
    const bookingStart = set(addDays(new Date(), 387), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    const bookingEnd = set(addDays(new Date(), 387), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: bookingStart,
      end_time: bookingEnd,
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
    const bookingStart = set(addDays(new Date(), 387), { hours: 11, minutes: 0, seconds: 0, milliseconds: 0 });
    const bookingEnd = set(addDays(new Date(), 387), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: bookingStart,
      end_time: bookingEnd,
      status: BookingStatus.ACTIVE,
    });
    await bookingRepository.save(booking);

    return request(app.getHttpServer())
      .get(`/bookings?roomId=${testRoom.room_id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body).toBeInstanceOf(Array);
        if (res.body.length > 0) {
          expect(res.body[0].user_id).toBe(testUser.id);
          expect(res.body[0].room_id).toBe(testRoom.room_id);
        }
      });
  });

  it('/bookings/:id (GET) should return a specific booking', async () => {
    const bookingStart = set(addDays(new Date(), 387), { hours: 13, minutes: 0, seconds: 0, milliseconds: 0 });
    const bookingEnd = set(addDays(new Date(), 387), { hours: 14, minutes: 0, seconds: 0, milliseconds: 0 });
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: bookingStart,
      end_time: bookingEnd,
      status: BookingStatus.ACTIVE,
    });
    const savedBooking = await bookingRepository.save(booking);

    return request(app.getHttpServer())
      .get(`/bookings/${savedBooking.id}`)
      .expect(200)
      .expect((res: Response) => {
        expect(res.body.id).toBe(savedBooking.id);
        expect(res.body.user_id).toBe(testUser.id);
        expect(res.body.room_id).toBe(testRoom.room_id);
      });
  });

  it('/bookings/:id (PATCH) should update a booking', async () => {
    const bookingStart = set(addDays(new Date(), 387), { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 });
    const bookingEnd = set(addDays(new Date(), 387), { hours: 16, minutes: 0, seconds: 0, milliseconds: 0 });
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: bookingStart,
      end_time: bookingEnd,
      status: BookingStatus.ACTIVE,
    });
    const savedBooking = await bookingRepository.save(booking);

    const updateStart = set(addDays(new Date(), 387), { hours: 16, minutes: 0, seconds: 0, milliseconds: 0 });
    const updateEnd = set(addDays(new Date(), 387), { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });
    const updateData = {
      start_time: updateStart.toISOString(),
      end_time: updateEnd.toISOString(),
    };

    return request(app.getHttpServer())
      .patch(`/bookings/${savedBooking.id}`)
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
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now (different from POST test)
    const booking = bookingRepository.create({
      user: testUser,
      room: testRoom,
      start_time: futureDate,
      end_time: new Date(futureDate.getTime() + 60 * 60 * 1000), // 1 hour later
      status: BookingStatus.ACTIVE,
    });
    const savedBooking = await bookingRepository.save(booking);

    return request(app.getHttpServer())
      .delete(`/bookings/${savedBooking.id}`)
      .expect(204);
  });
});
