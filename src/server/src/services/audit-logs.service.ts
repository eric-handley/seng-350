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
    const logs = await this.auditLogRepository.find({
      relations: ['user'],
      order: {
        created_at: 'DESC',
      },
    });

    return logs.map(log => ({
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      created_at: log.created_at,
      updated_at: log.updated_at,
      user: {
        id: log.user.id,
        email: log.user.email,
        first_name: log.user.first_name,
        last_name: log.user.last_name,
      },
    }));
  }

  async createAuditLog(
    userId: string,
    action: string,
    entityType: EntityType,
    entityId: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
    });

    return this.auditLogRepository.save(auditLog);
  }
}
