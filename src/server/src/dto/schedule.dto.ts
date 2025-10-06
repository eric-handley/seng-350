import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsArray, ValidateNested, IsNumber, Matches } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RoomType } from '../database/entities/room.entity';

export class ScheduleQueryDto {
  @ApiPropertyOptional({ description: "Filter by specific room ID (e.g., 'ECS-124')" })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  room_id?: string;

  @ApiPropertyOptional({ description: "Filter by building short name or full name (e.g., 'ECS', 'Engineering', 'Clearihue')" })
  @IsOptional()
  @IsString()
  building_short_name?: string;

  @ApiPropertyOptional({ description: "Filter by date (YYYY-MM-DD). Defaults to today." })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;

  @ApiPropertyOptional({ description: "Query range start time (hh-mm-ss). Defaults to 00-00-00." })
  @IsOptional()
  @Matches(/^\d{2}-\d{2}-\d{2}$/, { message: 'start_time must be in hh-mm-ss format' })
  start_time?: string;

  @ApiPropertyOptional({ description: "Query range end time (hh-mm-ss). Defaults to 23-59-59." })
  @IsOptional()
  @Matches(/^\d{2}-\d{2}-\d{2}$/, { message: 'end_time must be in hh-mm-ss format' })
  end_time?: string;

  @ApiPropertyOptional({
    enum: ['available', 'booked'],
    description: 'Type of slots to return. "available" shows free/unbooked times. "booked" shows occupied/scheduled times. Default: "available"',
  })
  @IsOptional()
  @IsIn(['available', 'booked'])
  slot_type?: 'available' | 'booked';
}

export class TimeSlotDto {
  @ApiProperty({ description: 'Start time of the slot' })
  @IsString()
  start_time!: Date;

  @ApiProperty({ description: 'End time of the slot' })
  @IsString()
  end_time!: Date;
}

export class RoomScheduleDto {
  @ApiProperty({ description: 'ID of the room' })
  @IsString()
  room_id!: string;

  @ApiProperty({ description: 'Room number' })
  @IsString()
  room_number!: string;

  @ApiProperty({ description: 'Capacity of the room' })
  @IsNumber()
  capacity!: number;

  @ApiProperty({ enum: RoomType, description: 'Type of the room' })
  room_type!: RoomType;

  @ApiProperty({ type: [TimeSlotDto], description: 'List of time slots' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  slots!: TimeSlotDto[];
}

export class BuildingScheduleDto {
  @ApiProperty({ description: 'Short name of the building' })
  @IsString()
  building_short_name!: string;

  @ApiProperty({ description: 'Full name of the building' })
  @IsString()
  building_name!: string;

  @ApiProperty({ type: [RoomScheduleDto], description: 'List of rooms in the building' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomScheduleDto)
  rooms!: RoomScheduleDto[];
}

export class ScheduleResponseDto {
  @ApiProperty({ type: [BuildingScheduleDto], description: 'List of buildings with their schedules' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuildingScheduleDto)
  buildings!: BuildingScheduleDto[];
}
