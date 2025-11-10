import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BookingsService } from '../../../src/services/bookings.service';
import { Booking, BookingStatus } from '../../../src/database/entities/booking.entity';
import { BookingSeries } from '../../../src/database/entities/booking-series.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { TestDataFactory, mockUUID, generateMockDate } from '../../test-helpers';
import { AuthenticatedUser } from '../../../src/auth/auth.service';
import { UserRole } from '../../../src/database/entities/user.entity';
import { CacheService } from '../../../src/shared/cache/cache.service';

export const mockUser: AuthenticatedUser = {
  id: mockUUID,
  email: 'test@uvic.ca',
  first_name: 'Test',
  last_name: 'User',
  role: UserRole.STAFF,
};

export const mockAdminUser: AuthenticatedUser = {
  id: 'admin-uuid',
  email: 'admin@uvic.ca',
  first_name: 'Admin',
  last_name: 'User',
  role: UserRole.ADMIN,
};

export const mockRegistrarUser: AuthenticatedUser = {
  id: 'registrar-uuid',
  email: 'registrar@uvic.ca',
  first_name: 'Registrar',
  last_name: 'User',
  role: UserRole.REGISTRAR,
};

export const mockBooking = {
  id: mockUUID,
  user_id: mockUUID,
  user: TestDataFactory.createUser({ id: mockUUID }),
  room: TestDataFactory.createRoom(undefined, { room_id: mockUUID }),
  start_time: generateMockDate(9),
  end_time: generateMockDate(10),
  status: BookingStatus.ACTIVE,
  created_at: generateMockDate(),
  updated_at: generateMockDate(),
};

export const mockBookingRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
};

export const mockBookingSeriesRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

export const mockRoomRepository = {
  findOne: jest.fn(),
};

export const mockCacheService = {
  registerScheduleCacheKey: jest.fn(),
  registerRoomCacheKey: jest.fn(),
  registerBuildingCacheKey: jest.fn(),
  clearScheduleCache: jest.fn(),
  clearRoomCache: jest.fn(),
  clearBuildingCache: jest.fn(),
  clearKey: jest.fn(),
};

export async function setupBookingsServiceTestModule() {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      BookingsService,
      {
        provide: getRepositoryToken(Booking),
        useValue: mockBookingRepository,
      },
      {
        provide: getRepositoryToken(BookingSeries),
        useValue: mockBookingSeriesRepository,
      },
      {
        provide: getRepositoryToken(Room),
        useValue: mockRoomRepository,
      },
      {
        provide: CacheService,
        useValue: mockCacheService,
      },
    ],
  }).compile();

  const service = module.get<BookingsService>(BookingsService);
  const bookingRepository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
  const bookingSeriesRepository = module.get<Repository<BookingSeries>>(getRepositoryToken(BookingSeries));
  const roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));

  return { service, bookingRepository, bookingSeriesRepository, roomRepository };
}
