import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../database/entities/booking.entity';
import { Room } from '../database/entities/room.entity';
import { CreateBookingDto, UpdateBookingDto, BookingResponseDto } from '../dto/booking.dto';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '../database/entities/user.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string): Promise<BookingResponseDto> {
    const { room_id, start_time, end_time } = createBookingDto;

    if (new Date(start_time) >= new Date(end_time)) {
      throw new BadRequestException('Start time must be before end time');
    }

    const room = await this.roomRepository.findOne({ where: { id: room_id } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.checkForConflicts(room_id, start_time, end_time);

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      user_id: userId,
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
    let effectiveUserId: string;

    if (userIdFilter) {
      // If filtering by specific user, check authorization
      if (userIdFilter !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Cannot view other users bookings');
      }
      effectiveUserId = userIdFilter;
    } else {
      // No filter: default to current user's bookings
      effectiveUserId = currentUser.id;
    }

    const query = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.room', 'room')
      .andWhere('booking.user_id = :userId', { userId: effectiveUserId });

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

    // Mandatory ownership check - allow if user owns booking OR is Admin
    if (booking.user_id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
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
      const room = await this.roomRepository.findOne({ where: { id: updateBookingDto.room_id } });
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

    // Mandatory ownership check - allow if user owns booking OR is Admin
    if (booking.user_id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
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
