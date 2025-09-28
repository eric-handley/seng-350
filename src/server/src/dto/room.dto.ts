import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomType } from '../database/entities/room.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RoomQueryDto {
  @ApiProperty({ example: 'uuid-string', description: 'Filter by building ID', required: false })
  @IsOptional()
  @IsUUID()
  building_id?: string;

  @ApiProperty({ example: 50, description: 'Minimum room capacity', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  min_capacity?: number;

  @ApiProperty({ enum: RoomType, example: RoomType.CLASSROOM, description: 'Filter by room type', required: false })
  @IsOptional()
  @IsEnum(RoomType)
  room_type?: RoomType;

  @ApiProperty({ example: 'projector', description: 'Filter by equipment name', required: false })
  @IsOptional()
  @IsString()
  equipment?: string;
}

export class RoomResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Room unique identifier' })
  id!: string;

  @ApiProperty({ example: 'A101', description: 'Room number/name' })
  room!: string;

  @ApiProperty({ example: 'uuid-string', description: 'Building ID' })
  building_id!: string;

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
    id: string;
    name: string;
    short_name: string;
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