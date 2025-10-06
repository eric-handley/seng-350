import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class RoomEquipmentResponseDto {
  @ApiProperty({ example: 'ECS-124', description: 'Room ID' })
  room_id!: string;

  @ApiProperty({ example: 'uuid-string', description: 'Equipment ID' })
  equipment_id!: string;

  @ApiProperty({ example: 2, description: 'Quantity of equipment in room', nullable: true })
  quantity!: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Creation date' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;
}

export class CreateRoomEquipmentDto {
  @ApiProperty({ example: 'ECS-124', description: 'Room ID (building_short_name-room_number)' })
  @IsString()
  @IsNotEmpty()
  room_id!: string;

  @ApiProperty({ example: 'uuid-string', description: 'Equipment ID' })
  @IsString()
  @IsNotEmpty()
  equipment_id!: string;

  @ApiProperty({ example: 2, description: 'Quantity of equipment in room', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class UpdateRoomEquipmentDto {
  @ApiProperty({ example: 2, description: 'Quantity of equipment in room', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
