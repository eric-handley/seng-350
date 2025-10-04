import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../database/entities/booking.entity';
import { BookingSeries } from '../database/entities/booking-series.entity';
import { Room } from '../database/entities/room.entity';
import { CreateBookingDto, UpdateBookingDto, BookingResponseDto, CreateBookingSeriesDto } from '../dto/booking.dto';
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

  async create(createBookingDto: CreateBookingDto, currentUser: AuthenticatedUser): Promise<BookingResponseDto> {
    const { room_id, start_time, end_time } = createBookingDto;

    if (new Date(start_time) >= new Date(end_time)) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validate booking constraints
    this.validateDuration(start_time, end_time);
    this.validateNotInPast(start_time, currentUser.role);
    this.validateAdvanceBooking(start_time, currentUser.role);

    const room = await this.roomRepository.findOne({ where: { room_id } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.checkForConflicts(room_id, start_time, end_time);

    const booking = this.bookingRepository.create({
      ...createBookingDto,
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
      query.andWhere('booking.room_id = :roomId', { roomId });
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

    if (updateBookingDto.room_id || updateBookingDto.start_time || updateBookingDto.end_time) {
      const roomId = updateBookingDto.room_id ?? booking.room_id;
      const startTime = updateBookingDto.start_time ?? booking.start_time;
      const endTime = updateBookingDto.end_time ?? booking.end_time;

      await this.checkForConflicts(roomId, startTime, endTime, id);
    }

    if (updateBookingDto.room_id) {
      const room = await this.roomRepository.findOne({ where: { room_id: updateBookingDto.room_id } });
      if (!room) {
        throw new NotFoundException('Room not found');
      }
    }

    Object.assign(booking, updateBookingDto);
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
    const query = this.bookingRepository.createQueryBuilder('booking')
      .where('booking.room_id = :roomId', { roomId })
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

  async createSeries(createSeriesDto: CreateBookingSeriesDto, userId: string): Promise<BookingResponseDto[]> {
    const { room_id, start_time, end_time, recurrence, recurrence_count } = createSeriesDto;

    if (new Date(start_time) >= new Date(end_time)) {
      throw new BadRequestException('Start time must be before end time');
    }

    const room = await this.roomRepository.findOne({ where: { room_id } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Calculate series end date
    const seriesEndDate = new Date(start_time);
    if (recurrence === 'weekly') {
      seriesEndDate.setDate(seriesEndDate.getDate() + (recurrence_count - 1) * 7);
    }

    // Create the booking series record
    const bookingSeries = this.bookingSeriesRepository.create({
      user_id: userId,
      room_id,
      start_time,
      end_time,
      series_end_date: seriesEndDate,
    });

    const savedSeries = await this.bookingSeriesRepository.save(bookingSeries);

    // Generate individual bookings
    const bookings: Booking[] = [];
    for (let i = 0; i < recurrence_count; i++) {
      const bookingStartTime = new Date(start_time);
      const bookingEndTime = new Date(end_time);

      if (recurrence === 'weekly') {
        bookingStartTime.setDate(bookingStartTime.getDate() + i * 7);
        bookingEndTime.setDate(bookingEndTime.getDate() + i * 7);
      }

      // Check for conflicts for this occurrence
      await this.checkForConflicts(room_id, bookingStartTime, bookingEndTime);

      const booking = this.bookingRepository.create({
        user_id: userId,
        room_id,
        start_time: bookingStartTime,
        end_time: bookingEndTime,
        status: BookingStatus.ACTIVE,
        booking_series_id: savedSeries.id,
      });

      const savedBooking = await this.bookingRepository.save(booking);
      bookings.push(savedBooking);
    }

    return bookings.map(booking => this.toResponseDto(booking));
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
      if (updateDto.start_time && updateDto.end_time) {
        if (new Date(updateDto.start_time) >= new Date(updateDto.end_time)) {
          throw new BadRequestException('Start time must be before end time');
        }
      }

      if (updateDto.room_id || updateDto.start_time || updateDto.end_time) {
        const roomId = updateDto.room_id ?? booking.room_id;
        const startTime = updateDto.start_time ?? booking.start_time;
        const endTime = updateDto.end_time ?? booking.end_time;

        await this.checkForConflicts(roomId, startTime, endTime, booking.id);
      }

      Object.assign(booking, updateDto);
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
    return {
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
  }
}
