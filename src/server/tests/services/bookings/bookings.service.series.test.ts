import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { BookingsService } from '../../../src/services/bookings.service';
import { Booking, BookingStatus } from '../../../src/database/entities/booking.entity';
import { TestDataFactory, mockUUID, generateMockDate } from '../../test-helpers';
import {
  setupBookingsServiceTestModule,
  mockUser,
  mockBooking,
  mockBookingRepository,
  mockBookingSeriesRepository,
  mockRoomRepository,
} from './bookings.service.test-setup';

describe('BookingsService - booking series', () => {
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

  it('should create a series of recurring bookings', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const startDate = generateMockDate(9);
    const endDate = generateMockDate(10);
    const seriesEndDate = new Date(startDate);
    seriesEndDate.setDate(seriesEndDate.getDate() + 28); // 4 weeks

    const mockSeries = {
      id: 'series-uuid',
      user_id: mockUser.id,
      room_id: mockUUID,
      start_time: startDate,
      end_time: endDate,
      series_end_date: seriesEndDate,
      recurrence_type: 'weekly',
    };
    const seriesDto = {
      room_id: mockUUID,
      start_time: startDate,
      end_time: endDate,
      series_end_date: seriesEndDate,
      recurrence_type: 'weekly' as const,
    };

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

    const result = await service.createBookingSeries(seriesDto, mockUser);

    expect(result).toBeDefined();
    expect(result.id).toBe('series-uuid');
    expect(mockBookingSeriesRepository.save).toHaveBeenCalled();
  });

  it('should update a single booking in a series', async () => {
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

  it('should update all bookings in a series when specified', async () => {
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

  it('should cancel a single booking in a series', async () => {
    const seriesBooking = { ...mockBooking, booking_series_id: 'series-uuid', status: BookingStatus.ACTIVE };

    mockBookingRepository.findOne.mockResolvedValue(seriesBooking);
    mockBookingRepository.save.mockResolvedValue({ ...seriesBooking, status: BookingStatus.CANCELLED });

    await service.remove(mockUUID, mockUser);

    expect(bookingRepository.save).toHaveBeenCalledTimes(1);
    expect(bookingRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: BookingStatus.CANCELLED })
    );
  });

  it('should delete all bookings in a series when specified', async () => {
    const startDate = generateMockDate(9, 0);
    const seriesEndDate = new Date(startDate);
    seriesEndDate.setDate(seriesEndDate.getDate() + 28);

    const mockSeries = {
      id: 'series-uuid',
      user_id: mockUser.id,
      room_id: mockUUID,
      start_time: startDate,
      end_time: generateMockDate(10, 0),
      series_end_date: seriesEndDate,
    };

    mockBookingSeriesRepository.findOne.mockResolvedValue(mockSeries);
    mockBookingSeriesRepository.remove.mockResolvedValue(mockSeries);

    await service.removeSeries('series-uuid', mockUser);

    expect(mockBookingSeriesRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'series-uuid' },
    });
    expect(mockBookingSeriesRepository.remove).toHaveBeenCalledWith(mockSeries);
  });

  it('should detect conflicts when creating booking series', async () => {
    const mockRoom = TestDataFactory.createRoom(undefined, { room_id: mockUUID });
    const mockSeries = { id: 'series-uuid' };
    const startDate = generateMockDate(9);
    const seriesEndDate = new Date(startDate);
    seriesEndDate.setDate(seriesEndDate.getDate() + 28);

    const seriesDto = {
      room_id: mockUUID,
      start_time: startDate,
      end_time: generateMockDate(10),
      series_end_date: seriesEndDate,
      recurrence_type: 'weekly' as const,
    };

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

    await expect(service.createBookingSeries(seriesDto, mockUser)).rejects.toThrow(ConflictException);
  });
});
