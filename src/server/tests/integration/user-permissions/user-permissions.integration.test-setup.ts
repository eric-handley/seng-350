import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { Booking, BookingStatus } from '../../../src/database/entities/booking.entity';
import { setupTestAppWithAuth } from '../auth-test-helpers';

export interface UserPermissionsTestContext {
  app: INestApplication;
  userRepository: Repository<User>;
}

export async function setupUserPermissionsTests(): Promise<UserPermissionsTestContext> {
  const setup = await setupTestAppWithAuth();
  return {
    app: setup.app,
    userRepository: setup.userRepository,
  };
}

export async function seedUsersWithRoles(
  userRepository: Repository<User>,
): Promise<{ staffUser1: User; staffUser2: User; registrarUser: User; adminUser: User }> {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const timestamp = Date.now();

  const staffUser1 = userRepository.create({
    email: `staff1-${timestamp}-1@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Staff',
    last_name: 'One',
    role: UserRole.STAFF,
  });
  await userRepository.save(staffUser1);

  const staffUser2 = userRepository.create({
    email: `staff2-${timestamp}-2@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Staff',
    last_name: 'Two',
    role: UserRole.STAFF,
  });
  await userRepository.save(staffUser2);

  const registrarUser = userRepository.create({
    email: `registrar-${timestamp}-3@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Registrar',
    last_name: 'User',
    role: UserRole.REGISTRAR,
  });
  await userRepository.save(registrarUser);

  const adminUser = userRepository.create({
    email: `admin-${timestamp}-4@uvic.ca`,
    password_hash: hashedPassword,
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
  });
  await userRepository.save(adminUser);

  return { staffUser1, staffUser2, registrarUser, adminUser };
}

export async function createBookingForUser(
  user: User,
  room: Room,
  bookingRepository: Repository<Booking>,
  daysInFuture: number = 23,
  startHour: number = 10
): Promise<Booking> {
  const { addDays, set } = await import('date-fns');

  const bookingStart = set(addDays(new Date(), daysInFuture), {
    hours: startHour,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const bookingEnd = set(addDays(new Date(), daysInFuture), {
    hours: startHour + 1,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  const booking = bookingRepository.create({
    user_id: user.id,
    room_id: room.room_id,
    start_time: bookingStart,
    end_time: bookingEnd,
    status: BookingStatus.ACTIVE,
  });

  return await bookingRepository.save(booking);
}
