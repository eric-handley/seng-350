import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class EquipmentResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Equipment unique identifier' })
  id!: string;

  @ApiProperty({ example: 'Projector', description: 'Equipment name' })
  name!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Equipment creation date' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;

  @ApiProperty({
    description: 'Rooms that have this equipment',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        room: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            room: { type: 'string', example: 'A101' },
            building_id: { type: 'string', example: 'uuid-string' },
            building_name: { type: 'string', example: 'Engineering Computer Science Building' },
            building_short_name: { type: 'string', example: 'ECS' },
          }
        },
        quantity: { type: 'number', example: 2, nullable: true }
      }
    },
    required: false
  })
  room_equipment?: Array<{
    room: {
      id: string;
      room: string;
      building_id: string;
      building_name: string;
      building_short_name: string;
    };
    quantity?: number;
  }>;
}

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Projector', description: 'Equipment name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name!: string;
}

export class UpdateEquipmentDto {
  @ApiProperty({ example: 'Projector', description: 'Equipment name', required: false })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name?: string;
}