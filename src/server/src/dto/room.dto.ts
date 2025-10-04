import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RoomType } from '../database/entities/room.entity';
import { ApiProperty } from '@nestjs/swagger';

const ROOM_TYPE_LOOKUP: Record<string, RoomType> = Object.values(RoomType).reduce(
  (acc, type) => {
    acc[type.toLowerCase()] = type;
    return acc;
  },
  {} as Record<string, RoomType>,
);

const normalizeRoomType = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  return ROOM_TYPE_LOOKUP[trimmed.toLowerCase()] ?? value;
};

export class RoomQueryDto {
  @ApiProperty({ example: 'ECS', description: 'Filter by building short name', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  building_short_name?: string;

  @ApiProperty({ example: 50, description: 'Minimum room capacity', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  min_capacity?: number;

  @ApiProperty({ enum: RoomType, example: RoomType.CLASSROOM, description: 'Filter by room type', required: false })
  @IsOptional()
  @IsEnum(RoomType)
  @Transform(({ value }) => normalizeRoomType(value))
  room_type?: RoomType;

  @ApiProperty({ example: 'projector', description: 'Filter by equipment name', required: false })
  @IsOptional()
  @IsString()
  equipment?: string;
}

export class RoomResponseDto {
  @ApiProperty({ example: 'ECS-124', description: 'Room unique identifier (building_short_name + room_number)' })
  room_id!: string;

  @ApiProperty({ example: 'ECS', description: 'Building short name' })
  building_short_name!: string;

  @ApiProperty({ example: '124', description: 'Room number' })
  room_number!: string;

  @ApiProperty({ example: 50, description: 'Room capacity' })
  capacity!: number;

  @ApiProperty({ enum: RoomType, example: RoomType.CLASSROOM, description: 'Room type' })
  room_type!: RoomType;

  @ApiProperty({ example: 'https://example.com/room/A101', description: 'Room details URL' })
  url!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Room creation date' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;

  @ApiProperty({ description: 'Building information', required: false })
  building?: {
    short_name: string;
    name: string;
  };

  @ApiProperty({ description: 'Room equipment', required: false })
  room_equipment?: Array<{
    equipment: {
      id: string;
      name: string;
    };
    quantity?: number;
  }>;
}
