import { CreateBookingSeriesDto, BookingSeriesResponseDto } from '../dto/booking-series.dto';
import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../database/entities/booking.entity';
import { BookingSeries } from '../database/entities/booking-series.entity';
import { Room } from '../database/entities/room.entity';
import { CreateBookingDto, UpdateBookingDto, BookingResponseDto } from '../dto/booking.dto';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '../database/entities/user.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingSeries)
    private readonly bookingSeriesRepository: Repository<BookingSeries>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async createBookingSeries(
    createBookingSeriesDto: CreateBookingSeriesDto,
    currentUser: AuthenticatedUser,
  ): Promise<BookingSeriesResponseDto> {
    const { room_id, start_time, end_time, series_end_date, recurrence_type } = createBookingSeriesDto;
    const normalizedRoomId = this.normalizeRoomId(room_id);

    if (!normalizedRoomId) {
      throw new BadRequestException('Room ID must not be empty');
    }

    if (new Date(start_time) >= new Date(end_time)) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validate booking constraints for the first occurrence
    this.validateDuration(start_time, end_time);
    this.validateNotInPast(start_time, currentUser.role);
    this.validateAdvanceBooking(start_time, currentUser.role);

    const room = await this.roomRepository.findOne({ where: { room_id: normalizedRoomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Create the booking series record
    const bookingSeries = this.bookingSeriesRepository.create({
      user_id: currentUser.id,
      room_id: normalizedRoomId,
      start_time,
      end_time,
      series_end_date,
    });
    const savedSeries = await this.bookingSeriesRepository.save(bookingSeries);

    // Generate all occurrences
    const bookings: Booking[] = [];
    const occurrenceStart = new Date(start_time);
    const occurrenceEnd = new Date(end_time);
    const lastDate = new Date(series_end_date);

    while (occurrenceStart <= lastDate) {
      // Check for conflicts for this occurrence
      await this.checkForConflicts(normalizedRoomId, occurrenceStart, occurrenceEnd);

      const booking = this.bookingRepository.create({
        user_id: currentUser.id,
        room_id: normalizedRoomId,
        start_time: new Date(occurrenceStart),
        end_time: new Date(occurrenceEnd),
        status: BookingStatus.ACTIVE,
        booking_series_id: savedSeries.id,
      });
      const savedBooking = await this.bookingRepository.save(booking);
      bookings.push(savedBooking);

      // Advance to next occurrence
      if (recurrence_type === 'daily') {
        occurrenceStart.setDate(occurrenceStart.getDate() + 1);
        occurrenceEnd.setDate(occurrenceEnd.getDate() + 1);
      } else if (recurrence_type === 'weekly') {
        occurrenceStart.setDate(occurrenceStart.getDate() + 7);
        occurrenceEnd.setDate(occurrenceEnd.getDate() + 7);
      } else if (recurrence_type === 'monthly') {
        occurrenceStart.setMonth(occurrenceStart.getMonth() + 1);
        occurrenceEnd.setMonth(occurrenceEnd.getMonth() + 1);
      } else {
        throw new BadRequestException('Invalid recurrence_type');
      }
    }

    // Build response DTO
    const response: BookingSeriesResponseDto = {
      id: savedSeries.id,
      user_id: savedSeries.user_id,
      room_id: savedSeries.room_id,
      start_time: savedSeries.start_time,
      end_time: savedSeries.end_time,
      series_end_date: savedSeries.series_end_date,
      bookings: bookings.map(b => this.toResponseDto(b)),
      created_at: savedSeries.created_at,
      updated_at: savedSeries.updated_at,
    };
    return response;
  }

  async create(createBookingDto: CreateBookingDto, currentUser: AuthenticatedUser): Promise<BookingResponseDto> {
    const { start_time, end_time } = createBookingDto;
    const normalizedRoomId = this.normalizeRoomId(createBookingDto.room_id);

    if (!normalizedRoomId) {
      throw new BadRequestException('Room ID must not be empty');
    }

    if (new Date(start_time) >= new Date(end_time)) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validate booking constraints
    this.validateDuration(start_time, end_time);
    this.validateNotInPast(start_time, currentUser.role);
    this.validateAdvanceBooking(start_time, currentUser.role);

    const room = await this.roomRepository.findOne({ where: { room_id: normalizedRoomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.checkForConflicts(normalizedRoomId, start_time, end_time);

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      room_id: normalizedRoomId,
      user_id: currentUser.id,
      status: BookingStatus.ACTIVE,
    });

    const savedBooking = await this.bookingRepository.save(booking);
    return this.toResponseDto(savedBooking);
  }

  async findAll(
    currentUser: AuthenticatedUser,
    userIdFilter?: string,
    roomId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BookingResponseDto[]> {
    // Access control: Determine which user's bookings to query
    const canViewAll = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGISTRAR;
    let effectiveUserId: string | undefined;

    if (userIdFilter) {
      // If filtering by specific user, check authorization
      if (userIdFilter !== currentUser.id && !canViewAll) {
        throw new ForbiddenException('Cannot view other users bookings');
      }
      effectiveUserId = userIdFilter;
    } else {
      // No filter: STAFF sees own bookings, REGISTRAR/ADMIN see all bookings
      if (!canViewAll) {
        effectiveUserId = currentUser.id;
      }
      // For REGISTRAR/ADMIN, effectiveUserId remains undefined to show all bookings
    }

    const query = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.room', 'room');

    if (effectiveUserId) {
      query.andWhere('booking.user_id = :userId', { userId: effectiveUserId });
    }

    if (roomId) {
      const normalizedRoomId = this.normalizeRoomId(roomId);

      if (!normalizedRoomId) {
        throw new BadRequestException('roomId must not be empty');
      }

      query.andWhere('booking.room_id = :roomId', { roomId: normalizedRoomId });
    }

    if (startDate) {
      query.andWhere('booking.start_time >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('booking.end_time <= :endDate', { endDate });
    }

    query.orderBy('booking.start_time', 'ASC');

    const bookings = await query.getMany();
    return bookings.map(booking => this.toResponseDto(booking));
  }

  async findOne(id: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user', 'room', 'booking_series'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.toResponseDto(booking);
  }

  async update(id: string, updateBookingDto: UpdateBookingDto, currentUser: AuthenticatedUser): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: ['user', 'room'] });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Validate booking hasn't started (for STAFF only)
    this.validateNotStarted(booking, currentUser.role);

    // Mandatory ownership check - allow if user owns booking OR is Registrar/Admin
    const canManageAll = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGISTRAR;
    if (booking.user_id !== currentUser.id && !canManageAll) {
      throw new ForbiddenException('You can only update your own bookings');
    }

    if (updateBookingDto.start_time && updateBookingDto.end_time) {
      if (new Date(updateBookingDto.start_time) >= new Date(updateBookingDto.end_time)) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    const normalizedUpdateRoomId = updateBookingDto.room_id
      ? this.normalizeRoomId(updateBookingDto.room_id)
      : undefined;

    if (updateBookingDto.room_id && !normalizedUpdateRoomId) {
      throw new BadRequestException('Room ID must not be empty');
    }

    if (updateBookingDto.room_id || updateBookingDto.start_time || updateBookingDto.end_time) {
      const candidateRoomId =
        normalizedUpdateRoomId ?? booking.room_id ?? booking.room?.room_id;

      const normalizedTargetRoomId = this.normalizeRoomId(candidateRoomId);

      if (!normalizedTargetRoomId) {
        throw new BadRequestException('Room ID must not be empty');
      }

      const startTime = updateBookingDto.start_time ?? booking.start_time;
      const endTime = updateBookingDto.end_time ?? booking.end_time;

      await this.checkForConflicts(normalizedTargetRoomId, startTime, endTime, id);

      if (!normalizedUpdateRoomId && !booking.room_id) {
        booking.room_id = normalizedTargetRoomId;
      }
    }

    if (normalizedUpdateRoomId) {
      const room = await this.roomRepository.findOne({ where: { room_id: normalizedUpdateRoomId } });
      if (!room) {
        throw new NotFoundException('Room not found');
      }
    }

    Object.assign(booking, {
      ...updateBookingDto,
      ...(normalizedUpdateRoomId ? { room_id: normalizedUpdateRoomId } : {}),
    });
    const savedBooking = await this.bookingRepository.save(booking);
    return this.toResponseDto(savedBooking);
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const booking = await this.bookingRepository.findOne({ where: { id } });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Validate booking hasn't started (for STAFF only)
    this.validateNotStarted(booking, currentUser.role);

    // Mandatory ownership check - allow if user owns booking OR is Registrar/Admin
    const canManageAll = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGISTRAR;
    if (booking.user_id !== currentUser.id && !canManageAll) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    booking.status = BookingStatus.CANCELLED;
    await this.bookingRepository.save(booking);
  }

  private async checkForConflicts(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    const normalizedRoomId = this.normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      throw new BadRequestException('Room ID must not be empty');
    }

    const query = this.bookingRepository.createQueryBuilder('booking')
      .where('booking.room_id = :roomId', { roomId: normalizedRoomId })
      .andWhere('booking.status = :status', { status: BookingStatus.ACTIVE })
      .andWhere(
        '(booking.start_time < :endTime AND booking.end_time > :startTime)',
        { startTime, endTime }
      );

    if (excludeBookingId) {
      query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const conflictingBooking = await query.getOne();

    if (conflictingBooking) {
      throw new ConflictException('Room is already booked for this time slot');
    }
  }

  async updateSeries(seriesId: string, updateDto: UpdateBookingDto, currentUser: AuthenticatedUser): Promise<void> {
    // Find all bookings in the series
    const bookings = await this.bookingRepository.find({
      where: { booking_series_id: seriesId },
    });

    if (bookings.length === 0) {
      throw new NotFoundException('Booking series not found');
    }

    // Check ownership
    const canManageAll = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGISTRAR;
    if (bookings[0].user_id !== currentUser.id && !canManageAll) {
      throw new ForbiddenException('You can only update your own booking series');
    }

    // Update each booking in the series
    for (const booking of bookings) {
      const normalizedUpdateRoomId = updateDto.room_id
        ? this.normalizeRoomId(updateDto.room_id)
        : undefined;

      if (updateDto.room_id && !normalizedUpdateRoomId) {
        throw new BadRequestException('Room ID must not be empty');
      }

      if (updateDto.start_time && updateDto.end_time) {
        if (new Date(updateDto.start_time) >= new Date(updateDto.end_time)) {
          throw new BadRequestException('Start time must be before end time');
        }
      }

      if (updateDto.room_id || updateDto.start_time || updateDto.end_time) {
        const candidateRoomId =
          normalizedUpdateRoomId ?? booking.room_id ?? booking.room?.room_id;

        const normalizedTargetRoomId = this.normalizeRoomId(candidateRoomId);

        if (!normalizedTargetRoomId) {
          throw new BadRequestException('Room ID must not be empty');
        }

        const startTime = updateDto.start_time ?? booking.start_time;
        const endTime = updateDto.end_time ?? booking.end_time;

        await this.checkForConflicts(normalizedTargetRoomId, startTime, endTime, booking.id);

        if (!normalizedUpdateRoomId && !booking.room_id) {
          booking.room_id = normalizedTargetRoomId;
        }
      }

      Object.assign(booking, {
        ...updateDto,
        ...(normalizedUpdateRoomId ? { room_id: normalizedUpdateRoomId } : {}),
      });
      await this.bookingRepository.save(booking);
    }
  }

  async removeSeries(seriesId: string, currentUser: AuthenticatedUser): Promise<void> {
    const series = await this.bookingSeriesRepository.findOne({
      where: { id: seriesId },
    });

    if (!series) {
      throw new NotFoundException('Booking series not found');
    }

    // Check ownership
    const canManageAll = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGISTRAR;
    if (series.user_id !== currentUser.id && !canManageAll) {
      throw new ForbiddenException('You can only delete your own booking series');
    }

    // Delete the series (cascade will delete associated bookings)
    await this.bookingSeriesRepository.remove(series);
  }

  private normalizeRoomId(value?: string): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed.toUpperCase() : undefined;
  }

  private validateNotInPast(startTime: Date, userRole: UserRole): void {
    if (userRole === UserRole.STAFF && new Date(startTime) < new Date()) {
      throw new BadRequestException('Cannot create bookings in the past');
    }
  }

  private validateDuration(startTime: Date, endTime: Date): void {
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes < 15) {
      throw new BadRequestException('Booking must be at least 15 minutes');
    }

    const durationHours = durationMinutes / 60;
    if (durationHours > 8) {
      throw new BadRequestException('Booking cannot exceed 8 hours');
    }
  }

  private validateAdvanceBooking(startTime: Date, userRole: UserRole): void {
    if (userRole === UserRole.STAFF) {
      const now = new Date();
      const threeMonthsFromNow = new Date(now);
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      if (new Date(startTime) > threeMonthsFromNow) {
        throw new BadRequestException('Staff cannot book more than 3 months in advance');
      }
    }
  }

  private validateNotStarted(booking: Booking, userRole: UserRole): void {
    if (userRole === UserRole.STAFF && new Date(booking.start_time) < new Date()) {
      throw new BadRequestException('Cannot modify bookings that have already started');
    }
  }

  private toResponseDto(booking: Booking): BookingResponseDto {
    const response: BookingResponseDto = {
      id: booking.id,
      user_id: booking.user_id,
      room_id: booking.room_id,
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.status,
      booking_series_id: booking.booking_series_id,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    };

    // Include user details if user relation is loaded
    if (booking.user) {
      response.user = {
        id: booking.user.id,
        email: booking.user.email,
        first_name: booking.user.first_name,
        last_name: booking.user.last_name,
        role: booking.user.role,
      };
    }

    return response;
  }
}
