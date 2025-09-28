import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { BookingStatus } from '../database/entities/booking.entity';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-string', description: 'Room ID to book' })
  @IsUUID()
  @IsNotEmpty()
  room_id!: string;

  @ApiProperty({ example: '2024-01-01T09:00:00Z', description: 'Booking start time (ISO 8601)' })
  @Type(() => Date)
  @IsDate()
  start_time!: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Booking end time (ISO 8601)' })
  @Type(() => Date)
  @IsDate()
  end_time!: Date;

  @ApiProperty({ example: 'uuid-string', description: 'Optional booking series ID for recurring bookings', required: false })
  @IsOptional()
  @IsUUID()
  booking_series_id?: string;
}

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @ApiProperty({ example: 'uuid-string', description: 'Room ID to book', required: false })
  @IsOptional()
  @IsUUID()
  room_id?: string;

  @ApiProperty({ example: '2024-01-01T09:00:00Z', description: 'Booking start time (ISO 8601)', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_time?: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Booking end time (ISO 8601)', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_time?: Date;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CANCELLED, description: 'Booking status', required: false })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}

export class BookingResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Booking unique identifier' })
  id!: string;

  @ApiProperty({ example: 'uuid-string', description: 'User ID who made the booking' })
  user_id!: string;

  @ApiProperty({ example: 'uuid-string', description: 'Room ID that was booked' })
  room_id!: string;

  @ApiProperty({ example: '2024-01-01T09:00:00Z', description: 'Booking start time' })
  start_time!: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Booking end time' })
  end_time!: Date;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.ACTIVE, description: 'Booking status' })
  status!: BookingStatus;

  @ApiProperty({ example: 'uuid-string', description: 'Booking series ID if part of recurring booking', required: false })
  booking_series_id?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Booking creation date' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;
}