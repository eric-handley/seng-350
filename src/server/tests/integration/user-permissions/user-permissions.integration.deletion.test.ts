import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { addDays, set } from 'date-fns';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { Booking, BookingStatus } from '../../../src/database/entities/booking.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { setupUserPermissionsTests } from './user-permissions.integration.test-setup';

describe('User deletion with bookings (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let bookingRepository: Repository<Booking>;
  let roomRepository: Repository<Room>;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupUserPermissionsTests();
    app = setup.app;
    userRepository = setup.userRepository;

    bookingRepository = app.get<Repository<Booking>>(getRepositoryToken(Booking));
    roomRepository = app.get<Repository<Room>>(getRepositoryToken(Room));

    const hashedPassword = await bcrypt.hash('password123', 10);

    adminUser = userRepository.create({
      email: `admin-delete-test-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'DeleteTest',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cascade delete all bookings when user is deleted', async () => {
    const agent = request.agent(app.getHttpServer());
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create user with future bookings
    const userToDelete = userRepository.create({
      email: `user-with-bookings-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'ToDelete',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    await userRepository.save(userToDelete);

    const room = await roomRepository.findOne({ where: {} });
    if (!room) {
      throw new Error('No rooms found for testing');
    }

    // Create future booking
    const futureStart = set(addDays(new Date(), 570), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
    const futureEnd = set(addDays(new Date(), 570), { hours: 11, minutes: 0, seconds: 0, milliseconds: 0 });
    const futureBooking = bookingRepository.create({
      user: userToDelete,
      room: room,
      start_time: futureStart,
      end_time: futureEnd,
      status: BookingStatus.ACTIVE,
    });
    await bookingRepository.save(futureBooking);

    // Login as admin and delete user
    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    await agent.delete(`/users/${userToDelete.id}`).expect(204);

    // Verify booking was cascade deleted
    const deletedBooking = await bookingRepository.findOne({
      where: { id: futureBooking.id },
    });

    expect(deletedBooking).toBeNull();
  });

  it('should cascade delete bookings when user is deleted', async () => {
    const agent = request.agent(app.getHttpServer());
    const hashedPassword = await bcrypt.hash('password123', 10);

    const userToDelete = userRepository.create({
      email: `user-cascade-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Cascade',
      last_name: 'User',
      role: UserRole.STAFF,
    });
    await userRepository.save(userToDelete);

    const room = await roomRepository.findOne({ where: {} });
    if (!room) {
      throw new Error('No rooms found for testing');
    }

    const futureStart = set(addDays(new Date(), 600), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 });
    const futureEnd = set(addDays(new Date(), 600), { hours: 11, minutes: 0, seconds: 0, milliseconds: 0 });
    const booking = bookingRepository.create({
      user: userToDelete,
      room: room,
      start_time: futureStart,
      end_time: futureEnd,
      status: BookingStatus.ACTIVE,
    });
    await bookingRepository.save(booking);

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    await agent.delete(`/users/${userToDelete.id}`).expect(204);

    // Booking should be cascade deleted
    const deletedBooking = await bookingRepository.findOne({
      where: { id: booking.id },
    });

    expect(deletedBooking).toBeNull();
  });
});
