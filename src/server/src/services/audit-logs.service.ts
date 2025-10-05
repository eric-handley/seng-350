import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AuditLogResponseDto } from '../dto/audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(filters?: {
    action?: string;
    route?: string;
    userId?: string;
    startTime?: Date;
    endTime?: Date;
    offset?: number;
    limit?: number;
  }): Promise<AuditLogResponseDto[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')
      .orderBy('audit_log.created_at', 'DESC');

    if (filters?.action) {
      queryBuilder.andWhere('audit_log.action LIKE :action', { action: `${filters.action}%` });
    }

    if (filters?.route) {
      queryBuilder.andWhere('audit_log.route = :route', { route: filters.route });
    }

    if (filters?.userId) {
      queryBuilder.andWhere('audit_log.user_id = :userId', { userId: filters.userId });
    }

    if (filters?.startTime) {
      queryBuilder.andWhere('audit_log.created_at >= :startTime', { startTime: filters.startTime });
    }

    if (filters?.endTime) {
      queryBuilder.andWhere('audit_log.created_at <= :endTime', { endTime: filters.endTime });
    }

    if (filters?.offset !== undefined) {
      queryBuilder.skip(filters.offset);
    }

    if (filters?.limit !== undefined) {
      queryBuilder.take(filters.limit);
    }

    const logs = await queryBuilder.getMany();

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      route: log.route,
      entity_id: log.entity_id,
      created_at: log.created_at,
      updated_at: log.updated_at,
      user: log.user ? {
        id: log.user.id,
        email: log.user.email,
        first_name: log.user.first_name,
        last_name: log.user.last_name,
      } : null,
    }));
  }

  async createAuditLog(
    userId: string | null,
    action: string,
    route: string,
    entityId: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      user_id: userId,
      action,
      route,
      entity_id: entityId,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async logApiError(
    request: { method: string; url: string; route?: { path: string }; body?: unknown; user?: { id: string } },
    statusCode: number,
  ): Promise<void> {
    const path = request.route?.path ?? request.url;

    // Skip audit logging for certain routes
    const skipRoutes = ['/api/auth/session', '/api-docs'];
    if (skipRoutes.some(route => path.includes(route))) {
      return;
    }

    const method = request.method;
    const actionMap: Record<string, string> = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    const baseAction = actionMap[method] ?? method;
    const action = `${baseAction}_ERROR_${statusCode}`;

    // Extract route and entity ID
    const { route, entityId } = this.extractRouteInfo(path, request);

    // Use null for unauthenticated requests
    const userId = request.user?.id ?? null;

    console.log('[AuditLogsService] Logging API error:', { userId, action, route, entityId, statusCode });

    // Create audit log
    try {
      await this.createAuditLog(userId, action, route, entityId);
      console.log('[AuditLogsService] Error logged successfully');
    } catch (err) {
      console.error('[AuditLogsService] Failed to log error:', err);
    }
  }

  private extractRouteInfo(
    path: string,
    request: { method: string; body?: unknown },
  ): { route: string; entityId: string } {
    // Remove leading /api if present
    const cleanPath = path.replace(/^\/api/, '');

    // Extract route name and ID
    const pathParts = cleanPath.split('/').filter(p => p);

    if (pathParts.length === 0) {
      return { route: 'root', entityId: '/' };
    }

    const baseRoute = `/${pathParts[0]}`;

    // If there's an ID in the path (second part), use it
    if (pathParts.length > 1) {
      return { route: baseRoute, entityId: pathParts[1] };
    }

    // For POST (create), check if body has an ID, otherwise mark as 'new'
    if (request.method === 'POST') {
      if (typeof request.body === 'object' && request.body !== null && 'id' in request.body) {
        return { route: baseRoute, entityId: request.body.id as string };
      }
      return { route: baseRoute, entityId: 'new' };
    }

    // For GET on collection endpoints
    if (request.method === 'GET') {
      return { route: baseRoute, entityId: 'collection' };
    }

    // Fallback
    return { route: baseRoute, entityId: 'unknown' };
  }
}
