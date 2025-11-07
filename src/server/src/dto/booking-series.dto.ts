import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BookingResponseDto } from './booking.dto';

export class CreateBookingSeriesDto {
  @ApiProperty({ example: 'ECS-124', description: 'Room code to book for the series' })
  @IsNotEmpty()
  @IsString()
  room_id!: string;

  @ApiProperty({ example: '2024-01-01T09:00:00Z', description: 'Series start time (ISO 8601)' })
  @IsDateString()
  @Type(() => Date)
  start_time!: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Series end time (ISO 8601)' })
  @IsDateString()
  @Type(() => Date)
  end_time!: Date;

  @ApiProperty({ example: '2024-04-30T00:00:00Z', description: 'Last date for the recurring series (ISO 8601)' })
  @IsDateString()
  @Type(() => Date)
  series_end_date!: Date;

  @ApiProperty({
    example: 'weekly',
    description: 'Recurrence type: "daily", "weekly", or "monthly"',
    enum: ['daily', 'weekly', 'monthly'],
  })
  @IsNotEmpty()
  recurrence_type!: 'daily' | 'weekly' | 'monthly';
}

export class UpdateBookingSeriesDto extends PartialType(CreateBookingSeriesDto) {
  @ApiProperty({ example: 'ECS-124', description: 'Room code to book for the series', required: false })
  @IsOptional()
  @IsString()
  room_id?: string;

  @ApiProperty({ example: '2024-01-01T09:00:00Z', description: 'Series start time (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  start_time?: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Series end time (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  end_time?: Date;

  @ApiProperty({ example: '2024-04-30', description: 'Last date for the recurring series (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  series_end_date?: Date;

  @ApiProperty({
    example: 'weekly',
    description: 'Recurrence type: "daily", "weekly", or "monthly"',
    enum: ['daily', 'weekly', 'monthly'],
    required: false,
  })
  @IsOptional()
  recurrence_type?: 'daily' | 'weekly' | 'monthly';
}

export class BookingSeriesResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Booking series unique identifier' })
  id!: string;

  @ApiProperty({ example: 'uuid-string', description: 'User ID who created the series' })
  user_id!: string;

  @ApiProperty({ example: 'uuid-string', description: 'Room ID for the series' })
  room_id!: string;

  @ApiProperty({ example: '2024-01-01T09:00:00Z', description: 'Series start time' })
  start_time!: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Series end time' })
  end_time!: Date;

  @ApiProperty({ example: '2024-04-30', description: 'Last date for the recurring series' })
  series_end_date!: Date;

  @ApiProperty({ type: [BookingResponseDto], description: 'Individual bookings generated from this series' })
  bookings?: BookingResponseDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Series creation date' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;
}