import { ApiProperty } from '@nestjs/swagger';
import { RoomResponseDto } from './room.dto';

export class BuildingResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Building unique identifier' })
  id!: string;

  @ApiProperty({ example: 'Engineering Computer Science Building', description: 'Full building name' })
  name!: string;

  @ApiProperty({ example: 'ECS', description: 'Building short name or code' })
  short_name!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Building creation date' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;

  @ApiProperty({ type: [RoomResponseDto], description: 'Rooms in this building', required: false })
  rooms?: RoomResponseDto[];
}