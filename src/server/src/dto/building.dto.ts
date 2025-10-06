import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { RoomResponseDto } from './room.dto';

export class CreateBuildingDto {
  @ApiProperty({ example: 'ECS', description: 'Building short name or code (uppercase)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  short_name!: string;

  @ApiProperty({ example: 'Engineering Computer Science Building', description: 'Full building name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;
}

export class UpdateBuildingDto {
  @ApiProperty({ example: 'Engineering Computer Science Building', description: 'Full building name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;
}

export class BuildingResponseDto {
  @ApiProperty({ example: 'ECS', description: 'Building short name or code' })
  short_name!: string;

  @ApiProperty({ example: 'Engineering Computer Science Building', description: 'Full building name' })
  name!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Building creation date' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;

  @ApiProperty({ type: [RoomResponseDto], description: 'Rooms in this building', required: false })
  rooms?: RoomResponseDto[];
}