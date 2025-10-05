import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';

import { BookingsService } from '../../src/services/bookings.service';
import { Booking, BookingStatus } from '../../src/database/entities/booking.entity';
import { BookingSeries } from '../../src/database/entities/booking-series.entity';
import { Room } from '../../src/database/entities/room.entity';
import { CreateBookingDto, UpdateBookingDto } from '../../src/dto/booking.dto';
import { TestDataFactory, mockUUID, generateMockDate } from '../test-helpers';
import { AuthenticatedUser } from '../../src/auth/auth.service';
import { UserRole } from '../../src/database/entities/user.entity';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepository: Repository<Booking>;
  let roomRepository: Repository<Room>;

  const mockUser: AuthenticatedUser = {
    id: mockUUID,
    email: 'test@uvic.ca',
    first_name: 'Test',
    last_name: 'User',
    role: UserRole.STAFF,
  };

  const mockAdminUser: AuthenticatedUser = {
    id: 'admin-uuid',
    email: 'admin@uvic.ca',
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
  };

  const mockBooking = {
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

  const mockBookingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBookingSeriesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockRoomRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
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
      const pastBookingDto = {
        ...createBookingDto,
        start_time: new Date('2020-01-01T09:00:00Z'), // Past date
        end_time: new Date('2020-01-01T10:00:00Z'),
      };

      await expect(service.create(pastBookingDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should allow ADMIN to create bookings in the past', async () => {
      const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
      const pastBookingDto = {
        ...createBookingDto,
        start_time: new Date('2020-01-01T09:00:00Z'),
        end_time: new Date('2020-01-01T10:00:00Z'),
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
      const mockRegistrarUser: AuthenticatedUser = {
        id: 'registrar-uuid',
        email: 'registrar@uvic.ca',
        first_name: 'Registrar',
        last_name: 'User',
        role: UserRole.REGISTRAR,
      };
      const pastBookingDto = {
        ...createBookingDto,
        start_time: new Date('2020-01-01T09:00:00Z'),
        end_time: new Date('2020-01-01T10:00:00Z'),
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
      const mockRegistrarUser: AuthenticatedUser = {
        id: 'registrar-uuid',
        email: 'registrar@uvic.ca',
        first_name: 'Registrar',
        last_name: 'User',
        role: UserRole.REGISTRAR,
      };
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

  describe('findAll', () => {
    it('should return all bookings for current user without filters', async () => {
      const mockBookings = [mockBooking];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBookings),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockUser);

      expect(bookingRepository.createQueryBuilder).toHaveBeenCalledWith('booking');
      expect(result).toBeDefined();
    });

    it('should return bookings for current user with filters', async () => {
      const mockBookings = [mockBooking];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBookings),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockUser, mockUUID, mockUUID, generateMockDate(), generateMockDate(24));

      expect(bookingRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should allow admin to view other users bookings', async () => {
      const mockBookings = [mockBooking];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBookings),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockAdminUser, 'other-user-id');

      expect(bookingRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when staff tries to view other users bookings', async () => {
      await expect(service.findAll(mockUser, 'other-user-id')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.findOne(mockUUID);

      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUUID },
        relations: ['user', 'room', 'booking_series'],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUUID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateBookingDto: UpdateBookingDto = {
      start_time: generateMockDate(11),
      end_time: generateMockDate(12),
    };

    it('should update a booking successfully', async () => {
      const updatedBooking = { ...mockBooking, ...updateBookingDto };
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue(updatedBooking);

      // Ensure conflict check query builder is properly mocked
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.update(mockUUID, updateBookingDto, mockUser);

      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUUID },
        relations: ['user', 'room'],
      });
      expect(bookingRepository.save).toHaveBeenCalled();
      // Result is a response DTO, not the entity object
      expect(result).toMatchObject({
        id: updatedBooking.id,
        user_id: updatedBooking.user_id,
        // room_id may be undefined in the mock as we don't set it
        start_time: updateBookingDto.start_time,
        end_time: updateBookingDto.end_time,
        status: updatedBooking.status,
      });
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUUID, updateBookingDto, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      const bookingWithDifferentUser = { ...mockBooking, user_id: 'different-user-id' };
      mockBookingRepository.findOne.mockResolvedValue(bookingWithDifferentUser);

      await expect(service.update(mockUUID, updateBookingDto, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any booking', async () => {
      const bookingWithDifferentUser = { ...mockBooking, user_id: 'different-user-id' };
      const updatedBooking = { ...bookingWithDifferentUser, ...updateBookingDto };
      mockBookingRepository.findOne.mockResolvedValue(bookingWithDifferentUser);
      mockBookingRepository.save.mockResolvedValue(updatedBooking);

      // Ensure conflict check query builder is properly mocked
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.update(mockUUID, updateBookingDto, mockAdminUser);

      expect(bookingRepository.findOne).toHaveBeenCalled();
      expect(bookingRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove a booking successfully', async () => {
      const bookingToCancel = { ...mockBooking, status: BookingStatus.ACTIVE };
      mockBookingRepository.findOne.mockResolvedValue(bookingToCancel);
      mockBookingRepository.save.mockResolvedValue({ ...bookingToCancel, status: BookingStatus.CANCELLED });

      await service.remove(mockUUID, mockUser);

      expect(bookingRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUUID } });
      expect(bookingRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUUID, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized cancellation', async () => {
      const bookingWithDifferentUser = {
        ...mockBooking,
        user_id: 'different-user-id',
      };
      mockBookingRepository.findOne.mockResolvedValue(bookingWithDifferentUser);

      await expect(service.remove(mockUUID, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to cancel any booking', async () => {
      const bookingWithDifferentUser = { ...mockBooking, user_id: 'different-user-id', status: BookingStatus.ACTIVE };
      mockBookingRepository.findOne.mockResolvedValue(bookingWithDifferentUser);
      mockBookingRepository.save.mockResolvedValue({ ...bookingWithDifferentUser, status: BookingStatus.CANCELLED });

      await service.remove(mockUUID, mockAdminUser);

      expect(bookingRepository.findOne).toHaveBeenCalled();
      expect(bookingRepository.save).toHaveBeenCalled();
    });
  });

  // TODO: Booking series not yet implemented
  describe('booking series', () => {
    it.skip('should create a series of recurring bookings', async () => {
      const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
      const mockSeries = { id: 'series-uuid' };

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockBookingSeriesRepository.create.mockReturnValue(mockSeries);
      mockBookingSeriesRepository.save.mockResolvedValue(mockSeries);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockBookingRepository.create.mockReturnValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue(mockBooking);

      // const result = await service.createSeries(seriesDto, mockUUID);

      // expect(result).toBeDefined();
      // expect(result.length).toBe(4);
      // expect(bookingRepository.save).toHaveBeenCalledTimes(4);
    });

    it.skip('should update a single booking in a series', async () => {
      const seriesBooking = { ...mockBooking, booking_series_id: 'series-uuid' };
      const updateDto = { start_time: generateMockDate(10, 0) };

      mockBookingRepository.findOne.mockResolvedValue(seriesBooking);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockBookingRepository.save.mockResolvedValue({ ...seriesBooking, ...updateDto });

      await service.update(mockUUID, updateDto, mockUser);

      expect(bookingRepository.findOne).toHaveBeenCalled();
      expect(bookingRepository.save).toHaveBeenCalledTimes(1); // Only one booking updated
    });

    it.skip('should update all bookings in a series when specified', async () => {
      const seriesBooking = { ...mockBooking, booking_series_id: 'series-uuid' };
      const updateDto = { start_time: generateMockDate(10, 0), update_series: true };

      mockBookingRepository.findOne.mockResolvedValue(seriesBooking);

      const seriesBookings = [
        { ...mockBooking, id: 'booking-1', booking_series_id: 'series-uuid' },
        { ...mockBooking, id: 'booking-2', booking_series_id: 'series-uuid' },
        { ...mockBooking, id: 'booking-3', booking_series_id: 'series-uuid' },
      ];

      mockBookingRepository.find.mockResolvedValue(seriesBookings);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockBookingRepository.save.mockResolvedValue(seriesBooking);

      await service.updateSeries('series-uuid', updateDto, mockUser);

      expect(bookingRepository.find).toHaveBeenCalledWith({
        where: { booking_series_id: 'series-uuid' },
      });
      expect(bookingRepository.save).toHaveBeenCalledTimes(3);
    });

    it.skip('should cancel a single booking in a series', async () => {
      const seriesBooking = { ...mockBooking, booking_series_id: 'series-uuid', status: BookingStatus.ACTIVE };

      mockBookingRepository.findOne.mockResolvedValue(seriesBooking);
      mockBookingRepository.save.mockResolvedValue({ ...seriesBooking, status: BookingStatus.CANCELLED });

      await service.remove(mockUUID, mockUser);

      expect(bookingRepository.save).toHaveBeenCalledTimes(1);
      expect(bookingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.CANCELLED })
      );
    });

    it.skip('should delete all bookings in a series when specified', async () => {
      const mockSeries = {
        id: 'series-uuid',
        user_id: mockUser.id,
        room_id: mockUUID,
        start_time: generateMockDate(9, 0),
        end_time: generateMockDate(10, 0),
        series_end_date: generateMockDate(9, 0),
      };

      mockBookingSeriesRepository.findOne.mockResolvedValue(mockSeries);
      mockBookingSeriesRepository.remove.mockResolvedValue(mockSeries);

      await service.removeSeries('series-uuid', mockUser);

      expect(mockBookingSeriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'series-uuid' },
      });
      expect(mockBookingSeriesRepository.remove).toHaveBeenCalledWith(mockSeries);
    });

    it.skip('should detect conflicts when creating booking series', async () => {
      const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
      const mockSeries = { id: 'series-uuid' };

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockBookingSeriesRepository.create.mockReturnValue(mockSeries);
      mockBookingSeriesRepository.save.mockResolvedValue(mockSeries);

      // Mock conflict on second occurrence
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(null) // First occurrence OK
          .mockResolvedValueOnce({ id: 'conflict-id' }), // Second has conflict
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // await expect(service.createSeries(seriesDto, mockUUID)).rejects.toThrow(ConflictException);
    });
  });

  describe('post-start modifications', () => {
    it('should block STAFF from updating booking after start_time', async () => {
      const now = new Date();
      const pastStartBooking = {
        ...mockBooking,
        start_time: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        end_time: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      };

      mockBookingRepository.findOne.mockResolvedValue(pastStartBooking);

      const updateDto = { end_time: new Date(now.getTime() + 2 * 60 * 60 * 1000) };

      await expect(service.update(mockUUID, updateDto, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should block STAFF from canceling booking after start_time', async () => {
      const now = new Date();
      const pastStartBooking = {
        ...mockBooking,
        start_time: new Date(now.getTime() - 60 * 60 * 1000),
        end_time: new Date(now.getTime() + 60 * 60 * 1000),
        status: BookingStatus.ACTIVE,
      };

      mockBookingRepository.findOne.mockResolvedValue(pastStartBooking);

      await expect(service.remove(mockUUID, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should allow ADMIN to update booking after start_time', async () => {
      const now = new Date();
      const pastStartBooking = {
        ...mockBooking,
        user_id: mockAdminUser.id,
        start_time: new Date(now.getTime() - 60 * 60 * 1000),
        end_time: new Date(now.getTime() + 60 * 60 * 1000),
      };

      mockBookingRepository.findOne.mockResolvedValue(pastStartBooking);

      const updateDto = { end_time: new Date(now.getTime() + 2 * 60 * 60 * 1000) };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockBookingRepository.save.mockResolvedValue({ ...pastStartBooking, ...updateDto });

      const result = await service.update(mockUUID, updateDto, mockAdminUser);

      expect(result).toBeDefined();
      expect(bookingRepository.save).toHaveBeenCalled();
    });

    it('should allow ADMIN to cancel booking after start_time', async () => {
      const now = new Date();
      const pastStartBooking = {
        ...mockBooking,
        user_id: mockAdminUser.id,
        start_time: new Date(now.getTime() - 60 * 60 * 1000),
        end_time: new Date(now.getTime() + 60 * 60 * 1000),
        status: BookingStatus.ACTIVE,
      };

      mockBookingRepository.findOne.mockResolvedValue(pastStartBooking);
      mockBookingRepository.save.mockResolvedValue({ ...pastStartBooking, status: BookingStatus.CANCELLED });

      await service.remove(mockUUID, mockAdminUser);

      expect(bookingRepository.save).toHaveBeenCalled();
      expect(bookingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.CANCELLED })
      );
    });
  });
});
