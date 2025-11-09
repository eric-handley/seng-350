import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { BookingsService } from '../../../src/services/bookings.service';
import { Booking } from '../../../src/database/entities/booking.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { CreateBookingDto } from '../../../src/dto/booking.dto';
import { TestDataFactory, mockUUID, generateMockDate } from '../../test-helpers';
import { subYears, set } from 'date-fns';
import {
  setupBookingsServiceTestModule,
  mockUser,
  mockAdminUser,
  mockRegistrarUser,
  mockBooking,
  mockBookingRepository,
  mockRoomRepository,
} from './bookings.service.test-setup';

describe('BookingsService - create', () => {
  let service: BookingsService;
  let bookingRepository: Repository<Booking>;
  let roomRepository: Repository<Room>;

  beforeEach(async () => {
    const { service: s, bookingRepository: br, roomRepository: rr } = await setupBookingsServiceTestModule();
    service = s;
    bookingRepository = br;
    roomRepository = rr;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createBookingDto: CreateBookingDto = {
    room_id: mockUUID,
    start_time: generateMockDate(9),
    end_time: generateMockDate(10),
  };

  it('should create a booking successfully', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });

    mockRoomRepository.findOne.mockResolvedValue(mockRoom);

    // Mock query builder for conflict check
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockBookingRepository.create.mockReturnValue(mockBooking);
    mockBookingRepository.save.mockResolvedValue(mockBooking);

    const result = await service.create(createBookingDto, mockUser);

    expect(roomRepository.findOne).toHaveBeenCalledWith({ where: { room_id: mockUUID } });
    expect(bookingRepository.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should throw NotFoundException when room not found', async () => {
    mockRoomRepository.findOne.mockResolvedValue(null);

    await expect(service.create(createBookingDto, mockUser)).rejects.toThrow(NotFoundException);
    expect(roomRepository.findOne).toHaveBeenCalledWith({ where: { room_id: mockUUID } });
  });

  it('should throw BadRequestException when start time is after end time', async () => {
    const invalidDto = {
      ...createBookingDto,
      start_time: generateMockDate(10),
      end_time: generateMockDate(9),
    };

    await expect(service.create(invalidDto, mockUser)).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException when room is already booked', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const conflictingBooking = { id: 'conflict-id' };

    mockRoomRepository.findOne.mockResolvedValue(mockRoom);

    // Mock query builder for conflict check - return booking to indicate conflict
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(conflictingBooking),
    };
    mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    await expect(service.create(createBookingDto, mockUser)).rejects.toThrow(ConflictException);
  });

  it('should block STAFF from creating bookings in the past', async () => {
    const pastDate = set(subYears(new Date(), 5), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    const pastBookingDto = {
      ...createBookingDto,
      start_time: pastDate, // Past date
      end_time: set(subYears(new Date(), 5), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
    };

    await expect(service.create(pastBookingDto, mockUser)).rejects.toThrow(BadRequestException);
  });

  it('should allow ADMIN to create bookings in the past', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const pastDate = set(subYears(new Date(), 5), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    const pastBookingDto = {
      ...createBookingDto,
      start_time: pastDate,
      end_time: set(subYears(new Date(), 5), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
    };

    mockRoomRepository.findOne.mockResolvedValue(mockRoom);

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockBookingRepository.create.mockReturnValue(mockBooking);
    mockBookingRepository.save.mockResolvedValue(mockBooking);

    const result = await service.create(pastBookingDto, mockAdminUser);

    expect(result).toBeDefined();
    expect(bookingRepository.save).toHaveBeenCalled();
  });

  it('should allow REGISTRAR to create bookings in the past', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const pastDate = set(subYears(new Date(), 5), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    const pastBookingDto = {
      ...createBookingDto,
      start_time: pastDate,
      end_time: set(subYears(new Date(), 5), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
    };

    mockRoomRepository.findOne.mockResolvedValue(mockRoom);

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockBookingRepository.create.mockReturnValue(mockBooking);
    mockBookingRepository.save.mockResolvedValue(mockBooking);

    const result = await service.create(pastBookingDto, mockRegistrarUser);

    expect(result).toBeDefined();
    expect(bookingRepository.save).toHaveBeenCalled();
  });

  it('should reject bookings shorter than 15 minutes', async () => {
    const shortBookingDto = {
      ...createBookingDto,
      start_time: generateMockDate(9, 0),
      end_time: generateMockDate(9, 10), // Only 10 minutes
    };

    await expect(service.create(shortBookingDto, mockUser)).rejects.toThrow(BadRequestException);
  });

  it('should accept bookings exactly 15 minutes long', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const minBookingDto = {
      ...createBookingDto,
      start_time: generateMockDate(9, 0),
      end_time: generateMockDate(9, 15), // Exactly 15 minutes
    };

    mockRoomRepository.findOne.mockResolvedValue(mockRoom);

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockBookingRepository.create.mockReturnValue(mockBooking);
    mockBookingRepository.save.mockResolvedValue(mockBooking);

    const result = await service.create(minBookingDto, mockUser);

    expect(result).toBeDefined();
    expect(bookingRepository.save).toHaveBeenCalled();
  });

  it('should reject bookings longer than 8 hours', async () => {
    const longBookingDto = {
      ...createBookingDto,
      start_time: generateMockDate(9, 0),
      end_time: generateMockDate(18, 0), // 9 hours
    };

    await expect(service.create(longBookingDto, mockUser)).rejects.toThrow(BadRequestException);
  });

  it('should accept bookings exactly 8 hours long', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const maxBookingDto = {
      ...createBookingDto,
      start_time: generateMockDate(9, 0),
      end_time: generateMockDate(17, 0), // Exactly 8 hours
    };

    mockRoomRepository.findOne.mockResolvedValue(mockRoom);

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockBookingRepository.create.mockReturnValue(mockBooking);
    mockBookingRepository.save.mockResolvedValue(mockBooking);

    const result = await service.create(maxBookingDto, mockUser);

    expect(result).toBeDefined();
    expect(bookingRepository.save).toHaveBeenCalled();
  });

  it('should block STAFF from booking more than 3 months in advance', async () => {
    const now = new Date();
    const fourMonthsAhead = new Date(now);
    fourMonthsAhead.setMonth(fourMonthsAhead.getMonth() + 4);

    const farFutureBookingDto = {
      ...createBookingDto,
      start_time: fourMonthsAhead,
      end_time: new Date(fourMonthsAhead.getTime() + 60 * 60 * 1000), // +1 hour
    };

    await expect(service.create(farFutureBookingDto, mockUser)).rejects.toThrow(BadRequestException);
  });

  it('should allow STAFF to book exactly 3 months in advance', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const now = new Date();
    const threeMonthsAhead = new Date(now);
    threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

    const threeMonthBookingDto = {
      ...createBookingDto,
      start_time: threeMonthsAhead,
      end_time: new Date(threeMonthsAhead.getTime() + 60 * 60 * 1000),
    };

    mockRoomRepository.findOne.mockResolvedValue(mockRoom);

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockBookingRepository.create.mockReturnValue(mockBooking);
    mockBookingRepository.save.mockResolvedValue(mockBooking);

    const result = await service.create(threeMonthBookingDto, mockUser);

    expect(result).toBeDefined();
    expect(bookingRepository.save).toHaveBeenCalled();
  });

  it('should allow ADMIN to book more than 3 months in advance', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const now = new Date();
    const sixMonthsAhead = new Date(now);
    sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

    const farFutureBookingDto = {
      ...createBookingDto,
      start_time: sixMonthsAhead,
      end_time: new Date(sixMonthsAhead.getTime() + 60 * 60 * 1000),
    };

    mockRoomRepository.findOne.mockResolvedValue(mockRoom);

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockBookingRepository.create.mockReturnValue(mockBooking);
    mockBookingRepository.save.mockResolvedValue(mockBooking);

    const result = await service.create(farFutureBookingDto, mockAdminUser);

    expect(result).toBeDefined();
    expect(bookingRepository.save).toHaveBeenCalled();
  });

  it('should allow REGISTRAR to book more than 3 months in advance', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const now = new Date();
    const sixMonthsAhead = new Date(now);
    sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

    const farFutureBookingDto = {
      ...createBookingDto,
      start_time: sixMonthsAhead,
      end_time: new Date(sixMonthsAhead.getTime() + 60 * 60 * 1000),
    };

    mockRoomRepository.findOne.mockResolvedValue(mockRoom);

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockBookingRepository.create.mockReturnValue(mockBooking);
    mockBookingRepository.save.mockResolvedValue(mockBooking);

    const result = await service.create(farFutureBookingDto, mockRegistrarUser);

    expect(result).toBeDefined();
    expect(bookingRepository.save).toHaveBeenCalled();
  });
});
