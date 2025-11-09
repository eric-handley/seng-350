import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { addDays, set } from 'date-fns';

import { User } from '../../../src/database/entities/user.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { setupUserPermissionsTests, seedUsersWithRoles } from './user-permissions.integration.test-setup';

describe('Cross-user authorization (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let roomRepository: Repository<Room>;
  let staffUser1: User;
  let staffUser2: User;

  beforeAll(async () => {
    const setup = await setupUserPermissionsTests();
    app = setup.app;
    userRepository = setup.userRepository;

    roomRepository = app.get<Repository<Room>>(getRepositoryToken(Room));

    const users = await seedUsersWithRoles(userRepository);
    staffUser1 = users.staffUser1;
    staffUser2 = users.staffUser2;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow user to view their own bookings', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    return agent
      .get('/bookings')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
      });
  });

  it('should prevent user from viewing other users bookings', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    // User1 should NOT be able to see user2's bookings
    return agent
      .get(`/bookings?userId=${staffUser2.id}`)
      .expect(403);
  });

  it('should prevent staff from modifying other staff bookings', async () => {
    const agent1 = request.agent(app.getHttpServer());
    const agent2 = request.agent(app.getHttpServer());

    // Get a test room
    const room = await roomRepository.findOne({ where: {} });
    if (!room) {
      throw new Error('No rooms found for testing');
    }

    // Staff user 1 logs in and creates a booking
    await agent1
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    const bookingDate = set(addDays(new Date(), 23), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
    const booking = {
      room_id: room.room_id,
      start_time: bookingDate.toISOString(),
      end_time: set(addDays(new Date(), 23), { hours: 11, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString(),
    };

    const createdBooking = await agent1
      .post('/bookings')
      .send(booking)
      .expect(201);

    // Staff user 2 logs in
    await agent2
      .post('/api/auth/login')
      .send({ email: staffUser2.email, password: 'password123' })
      .expect(200);

    // Staff user 2 should NOT be able to update staff user 1's booking
    await agent2
      .patch(`/bookings/${createdBooking.body.id}`)
      .send({ start_time: set(addDays(new Date(), 23), { hours: 14, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString() })
      .expect(403);

    // Staff user 2 should NOT be able to delete staff user 1's booking
    return agent2
      .delete(`/bookings/${createdBooking.body.id}`)
      .expect(403);
  });

  it('should allow user to create bookings for themselves', async () => {
    const agent = request.agent(app.getHttpServer());

    const room = await roomRepository.findOne({ where: {} });
    if (!room) {
      throw new Error('No rooms found for testing');
    }

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    const booking = {
      room_id: room.room_id,
      start_time: set(addDays(new Date(), 23), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString(),
      end_time: set(addDays(new Date(), 23), { hours: 13, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString(),
    };

    return agent
      .post('/bookings')
      .send(booking)
      .expect(201)
      .expect((res) => {
        expect(res.body.user_id).toBe(staffUser1.id);
      });
  });
});
