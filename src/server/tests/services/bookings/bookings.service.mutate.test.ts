import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { BookingsService } from '../../../src/services/bookings.service';
import { Booking, BookingStatus } from '../../../src/database/entities/booking.entity';
import { UpdateBookingDto } from '../../../src/dto/booking.dto';
import { TestDataFactory, mockUUID, generateMockDate } from '../../test-helpers';
import {
  setupBookingsServiceTestModule,
  mockUser,
  mockAdminUser,
  mockBooking,
  mockBookingRepository,
} from './bookings.service.test-setup';

describe('BookingsService - mutate', () => {
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

      await expect(service.update(mockUUID, updateBookingDto, mockUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      const bookingWithDifferentUser = { ...mockBooking, user_id: 'different-user-id' };
      mockBookingRepository.findOne.mockResolvedValue(bookingWithDifferentUser);

      await expect(service.update(mockUUID, updateBookingDto, mockUser)).rejects.toThrow(
        ForbiddenException
      );
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
      const bookingWithDifferentUser = {
        ...mockBooking,
        user_id: 'different-user-id',
        status: BookingStatus.ACTIVE,
      };
      mockBookingRepository.findOne.mockResolvedValue(bookingWithDifferentUser);
      mockBookingRepository.save.mockResolvedValue({
        ...bookingWithDifferentUser,
        status: BookingStatus.CANCELLED,
      });

      await service.remove(mockUUID, mockAdminUser);

      expect(bookingRepository.findOne).toHaveBeenCalled();
      expect(bookingRepository.save).toHaveBeenCalled();
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
      mockBookingRepository.save.mockResolvedValue({
        ...pastStartBooking,
        status: BookingStatus.CANCELLED,
      });

      await service.remove(mockUUID, mockAdminUser);

      expect(bookingRepository.save).toHaveBeenCalled();
      expect(bookingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.CANCELLED })
      );
    });
  });
});
