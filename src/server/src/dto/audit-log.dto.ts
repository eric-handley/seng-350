import { ApiProperty } from '@nestjs/swagger';
import { EntityType } from '../database/entities/audit-log.entity';

export class AuditLogResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Audit log unique identifier' })
  id!: string;

  @ApiProperty({ example: 'uuid-string', description: 'User ID who performed the action' })
  user_id!: string;

  @ApiProperty({ example: 'CREATE', description: 'Action performed' })
  action!: string;

  @ApiProperty({ enum: EntityType, example: EntityType.BOOKING, description: 'Type of entity affected' })
  entity_type!: EntityType;

  @ApiProperty({ example: 'uuid-or-composite-id', description: 'ID of the affected entity' })
  entity_id!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'When the action was performed' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;

  @ApiProperty({
    example: { id: 'uuid', email: 'user@uvic.ca', first_name: 'John', last_name: 'Doe' },
    description: 'User who performed the action'
  })
  user!: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}
