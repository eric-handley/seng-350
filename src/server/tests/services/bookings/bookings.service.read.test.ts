import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { BookingsService } from '../../../src/services/bookings.service';
import { Booking } from '../../../src/database/entities/booking.entity';
import { TestDataFactory, mockUUID, generateMockDate } from '../../test-helpers';
import {
  setupBookingsServiceTestModule,
  mockUser,
  mockAdminUser,
  mockBooking,
  mockBookingRepository,
} from './bookings.service.test-setup';

describe('BookingsService - read', () => {
  let service: BookingsService;
  let bookingRepository: Repository<Booking>;

  beforeEach(async () => {
    const { service: s, bookingRepository: br } = await setupBookingsServiceTestModule();
    service = s;
    bookingRepository = br;
  });

  afterEach(() => {
    jest.clearAllMocks();
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

      const result = await service.findAll(
        mockUser,
        mockUUID,
        mockUUID,
        generateMockDate(),
        generateMockDate(24)
      );

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
});
