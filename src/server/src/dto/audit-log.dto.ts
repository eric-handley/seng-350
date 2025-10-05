import { ApiProperty } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Audit log unique identifier' })
  id!: string;

  @ApiProperty({
    example: { id: 'uuid', email: 'user@uvic.ca', first_name: 'John', last_name: 'Doe' },
    description: 'User who performed the action',
    nullable: true
  })
  user!: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;

  @ApiProperty({ example: 'CREATE', description: 'Action performed' })
  action!: string;

  @ApiProperty({ example: '/buildings', description: 'API route/endpoint that was accessed' })
  route!: string;

  @ApiProperty({
    example: { query: { id: 'abc-123', force: 'true' }, body: { status: 'Cancelled' } },
    description: 'Combined request data (query params and body)',
    nullable: true
  })
  request!: { query?: Record<string, any> | null; body?: unknown } | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'When the action was performed' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;
}
