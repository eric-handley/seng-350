import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, EntityType } from '../database/entities/audit-log.entity';
import { AuditLogResponseDto } from '../dto/audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(): Promise<AuditLogResponseDto[]> {
    // Return placeholder data for now
    const placeholderLogs: AuditLogResponseDto[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: '550e8400-e29b-41d4-a716-446655440010',
        action: 'CREATE',
        entity_type: EntityType.BOOKING,
        entity_id: '550e8400-e29b-41d4-a716-446655440020',
        created_at: new Date('2024-01-15T10:30:00Z'),
        updated_at: new Date('2024-01-15T10:30:00Z'),
        user: {
          id: '550e8400-e29b-41d4-a716-446655440010',
          email: 'admin@uvic.ca',
          first_name: 'Admin',
          last_name: 'User',
        },
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        user_id: '550e8400-e29b-41d4-a716-446655440011',
        action: 'UPDATE',
        entity_type: EntityType.ROOM,
        entity_id: 'ECS-116',
        created_at: new Date('2024-01-15T11:45:00Z'),
        updated_at: new Date('2024-01-15T11:45:00Z'),
        user: {
          id: '550e8400-e29b-41d4-a716-446655440011',
          email: 'registrar@uvic.ca',
          first_name: 'Registrar',
          last_name: 'User',
        },
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        user_id: '550e8400-e29b-41d4-a716-446655440010',
        action: 'DELETE',
        entity_type: EntityType.BOOKING,
        entity_id: '550e8400-e29b-41d4-a716-446655440021',
        created_at: new Date('2024-01-15T14:20:00Z'),
        updated_at: new Date('2024-01-15T14:20:00Z'),
        user: {
          id: '550e8400-e29b-41d4-a716-446655440010',
          email: 'admin@uvic.ca',
          first_name: 'Admin',
          last_name: 'User',
        },
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        user_id: '550e8400-e29b-41d4-a716-446655440012',
        action: 'CREATE',
        entity_type: EntityType.USER,
        entity_id: '550e8400-e29b-41d4-a716-446655440013',
        created_at: new Date('2024-01-16T09:15:00Z'),
        updated_at: new Date('2024-01-16T09:15:00Z'),
        user: {
          id: '550e8400-e29b-41d4-a716-446655440012',
          email: 'admin2@uvic.ca',
          first_name: 'Second',
          last_name: 'Admin',
        },
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        user_id: '550e8400-e29b-41d4-a716-446655440011',
        action: 'UPDATE',
        entity_type: EntityType.EQUIPMENT,
        entity_id: '550e8400-e29b-41d4-a716-446655440030',
        created_at: new Date('2024-01-16T13:00:00Z'),
        updated_at: new Date('2024-01-16T13:00:00Z'),
        user: {
          id: '550e8400-e29b-41d4-a716-446655440011',
          email: 'registrar@uvic.ca',
          first_name: 'Registrar',
          last_name: 'User',
        },
      },
    ];

    return placeholderLogs;
  }
}
