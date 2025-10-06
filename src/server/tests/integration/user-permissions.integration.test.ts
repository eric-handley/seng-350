import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User, UserRole } from '../../src/database/entities/user.entity';
import { Booking, BookingStatus } from '../../src/database/entities/booking.entity';
import { Room } from '../../src/database/entities/room.entity';
import { setupTestAppWithAuth } from './auth-test-helpers';

describe('User viewing permissions (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let staffUser1: User;
  let staffUser2: User;
  let registrarUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    const hashedPassword = await bcrypt.hash('password123', 10);

    staffUser1 = userRepository.create({
      email: `staff1-view-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'One',
      role: UserRole.STAFF,
    });
    staffUser1 = await userRepository.save(staffUser1);

    staffUser2 = userRepository.create({
      email: `staff2-view-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'Two',
      role: UserRole.STAFF,
    });
    staffUser2 = await userRepository.save(staffUser2);

    registrarUser = userRepository.create({
      email: `registrar-view-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Registrar',
      last_name: 'User',
      role: UserRole.REGISTRAR,
    });
    registrarUser = await userRepository.save(registrarUser);

    adminUser = userRepository.create({
      email: `admin-view-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should block STAFF from viewing another STAFF user record', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    return agent.get(`/users/${staffUser2.id}`).expect(403);
  });

  it('should block STAFF from viewing ADMIN user record', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: staffUser1.email, password: 'password123' })
      .expect(200);

    return agent.get(`/users/${adminUser.id}`).expect(403);
  });

  it('should allow REGISTRAR to view any user record', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: registrarUser.email, password: 'password123' })
      .expect(200);

    await agent.get(`/users/${staffUser1.id}`).expect(200);
    await agent.get(`/users/${adminUser.id}`).expect(200);
  });

  it('should allow ADMIN to view any user record', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(200);

    await agent.get(`/users/${staffUser1.id}`).expect(200);
    await agent.get(`/users/${registrarUser.id}`).expect(200);
  });
});

describe('Cross-user authorization (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let roomRepository: Repository<Room>;
  let staffUser1: User;
  let staffUser2: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
    app = setup.app;
    userRepository = setup.userRepository;

    roomRepository = app.get<Repository<Room>>(getRepositoryToken(Room));

    const hashedPassword = await bcrypt.hash('password123', 10);

    staffUser1 = userRepository.create({
      email: `staff1-cross-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'One',
      role: UserRole.STAFF,
    });
    staffUser1 = await userRepository.save(staffUser1);

    staffUser2 = userRepository.create({
      email: `staff2-cross-${Date.now()}@uvic.ca`,
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'Two',
      role: UserRole.STAFF,
    });
    staffUser2 = await userRepository.save(staffUser2);
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

    // TODO: Add date library (e.g., date-fns) and replace hardcoded dates with dynamic dates relative to current time
    const booking = {
      room_id: room.room_id,
      start_time: '2025-12-01T10:00:00Z',
      end_time: '2025-12-01T11:00:00Z',
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
      .send({ start_time: '2025-12-01T14:00:00Z' })
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
      start_time: '2025-12-01T12:00:00Z',
      end_time: '2025-12-01T13:00:00Z',
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

describe('User deletion with bookings (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let bookingRepository: Repository<Booking>;
  let roomRepository: Repository<Room>;
  let adminUser: User;

  beforeAll(async () => {
    const setup = await setupTestAppWithAuth();
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
    const futureBooking = bookingRepository.create({
      user: userToDelete,
      room: room,
      start_time: new Date('2027-06-01T10:00:00Z'),
      end_time: new Date('2027-06-01T11:00:00Z'),
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

    const booking = bookingRepository.create({
      user: userToDelete,
      room: room,
      start_time: new Date('2027-07-01T10:00:00Z'),
      end_time: new Date('2027-07-01T11:00:00Z'),
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
