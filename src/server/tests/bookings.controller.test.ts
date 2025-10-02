import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from '../src/api/bookings.controller';
import { BookingsService } from '../src/services/bookings.service';
import { CreateBookingDto, UpdateBookingDto, BookingResponseDto } from '../src/dto/booking.dto';
import { BookingStatus } from '../src/database/entities/booking.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthenticatedUser } from '../src/auth/auth.service';
import { UserRole } from '../src/database/entities/user.entity';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid',
    email: 'test@uvic.ca',
    first_name: 'Test',
    last_name: 'User',
    role: UserRole.STAFF,
  };

  const mockBookingResponse: BookingResponseDto = {
    id: 'booking-uuid',
    user_id: 'user-uuid',
    room_id: 'room-uuid',
    start_time: new Date('2024-01-01T09:00:00Z'),
    end_time: new Date('2024-01-01T10:00:00Z'),
    status: BookingStatus.ACTIVE,
    booking_series_id: undefined,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockBookingsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createBookingDto: CreateBookingDto = {
      room_id: 'room-uuid',
      start_time: new Date('2024-01-01T09:00:00Z'),
      end_time: new Date('2024-01-01T10:00:00Z'),
    };

    it('should create a booking successfully', async () => {
      mockBookingsService.create.mockResolvedValue(mockBookingResponse);

      const result = await controller.create(createBookingDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createBookingDto, mockUser.id);
      expect(result).toEqual(mockBookingResponse);
    });
  });

  describe('findAll', () => {
    it('should return all bookings without filters', async () => {
      const mockBookings = [mockBookingResponse];
      mockBookingsService.findAll.mockResolvedValue(mockBookings);

      const result = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalledWith(mockUser, undefined, undefined, undefined, undefined);
      expect(result).toEqual(mockBookings);
    });

    it('should return bookings with userId filter', async () => {
      const mockBookings = [mockBookingResponse];
      mockBookingsService.findAll.mockResolvedValue(mockBookings);

      const result = await controller.findAll(mockUser, 'user-uuid');

      expect(service.findAll).toHaveBeenCalledWith(mockUser, 'user-uuid', undefined, undefined, undefined);
      expect(result).toEqual(mockBookings);
    });

    it('should return bookings with all filters', async () => {
      const mockBookings = [mockBookingResponse];
      mockBookingsService.findAll.mockResolvedValue(mockBookings);
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-02T00:00:00Z';

      const result = await controller.findAll(mockUser, 'user-uuid', 'room-uuid', startDate, endDate);

      expect(service.findAll).toHaveBeenCalledWith(
        mockUser,
        'user-uuid',
        'room-uuid',
        new Date(startDate),
        new Date(endDate)
      );
      expect(result).toEqual(mockBookings);
    });

    it('should handle date parsing correctly', async () => {
      const mockBookings = [mockBookingResponse];
      mockBookingsService.findAll.mockResolvedValue(mockBookings);

      await controller.findAll(mockUser, undefined, undefined, '2024-01-01T00:00:00Z');

      expect(service.findAll).toHaveBeenCalledWith(
        mockUser,
        undefined,
        undefined,
        new Date('2024-01-01T00:00:00Z'),
        undefined
      );
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      mockBookingsService.findOne.mockResolvedValue(mockBookingResponse);

      const result = await controller.findOne('booking-uuid');

      expect(service.findOne).toHaveBeenCalledWith('booking-uuid');
      expect(result).toEqual(mockBookingResponse);
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingsService.findOne.mockRejectedValue(new NotFoundException('Booking not found'));

      await expect(controller.findOne('non-existent-uuid')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('non-existent-uuid');
    });
  });

  describe('update', () => {
    const updateBookingDto: UpdateBookingDto = {
      start_time: new Date('2024-01-01T10:00:00Z'),
      end_time: new Date('2024-01-01T11:00:00Z'),
    };

    it('should update a booking successfully', async () => {
      const updatedBooking = { ...mockBookingResponse, ...updateBookingDto };
      mockBookingsService.update.mockResolvedValue(updatedBooking);

      const result = await controller.update('booking-uuid', updateBookingDto, mockUser);

      expect(service.update).toHaveBeenCalledWith('booking-uuid', updateBookingDto, mockUser);
      expect(result).toEqual(updatedBooking);
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingsService.update.mockRejectedValue(new NotFoundException('Booking not found'));

      await expect(controller.update('non-existent-uuid', updateBookingDto, mockUser)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith('non-existent-uuid', updateBookingDto, mockUser);
    });

    it('should throw ConflictException for room conflict', async () => {
      mockBookingsService.update.mockRejectedValue(new ConflictException('Room conflict'));

      await expect(controller.update('booking-uuid', updateBookingDto, mockUser)).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith('booking-uuid', updateBookingDto, mockUser);
    });
  });

  describe('remove', () => {
    it('should remove a booking successfully', async () => {
      mockBookingsService.remove.mockResolvedValue(undefined);

      await controller.remove('booking-uuid', mockUser);

      expect(service.remove).toHaveBeenCalledWith('booking-uuid', mockUser);
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingsService.remove.mockRejectedValue(new NotFoundException('Booking not found'));

      await expect(controller.remove('non-existent-uuid', mockUser)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith('non-existent-uuid', mockUser);
    });
  });
});