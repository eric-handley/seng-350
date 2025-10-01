import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';

import { BookingsService } from '../../src/services/bookings.service';
import { Booking, BookingStatus } from '../../src/database/entities/booking.entity';
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
    room: TestDataFactory.createRoom(undefined, { id: mockUUID }),
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
      const mockRoom = TestDataFactory.createRoom(undefined, { id: mockUUID });

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

      const result = await service.create(createBookingDto, mockUUID);

      expect(roomRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUUID } });
      expect(bookingRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });


    it('should throw NotFoundException when room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createBookingDto, mockUUID)).rejects.toThrow(NotFoundException);
      expect(roomRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUUID } });
    });

    it('should throw BadRequestException when start time is after end time', async () => {
      const invalidDto = {
        ...createBookingDto,
        start_time: generateMockDate(10),
        end_time: generateMockDate(9),
      };

      await expect(service.create(invalidDto, mockUUID)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when room is already booked', async () => {
      const mockRoom = TestDataFactory.createRoom(undefined, { id: mockUUID });
      const conflictingBooking = { id: 'conflict-id' };

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      
      // Mock query builder for conflict check - return booking to indicate conflict
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(conflictingBooking),
      };
      mockBookingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.create(createBookingDto, mockUUID)).rejects.toThrow(ConflictException);
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
});
