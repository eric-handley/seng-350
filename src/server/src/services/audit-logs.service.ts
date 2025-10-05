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
      queryBuilder.andWhere('audit_log.action LIKE :action', { action: `%${filters.action}%` });
    }

    if (filters?.route) {
      queryBuilder.andWhere('audit_log.route LIKE :route', { route: `%${filters.route}%` });
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
      user: log.user ? {
        id: log.user.id,
        email: log.user.email,
        first_name: log.user.first_name,
        last_name: log.user.last_name,
      } : null,
      action: log.action,
      route: log.route,
      request: (log.query || log.body) ? {
        query: log.query,
        body: log.body,
      } : null,
      created_at: log.created_at,
      updated_at: log.updated_at,
    }));
  }

  async createAuditLog(
    userId: string | null,
    action: string,
    route: string,
    query?: Record<string, unknown> | null,
    body?: unknown,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      user_id: userId,
      action,
      route,
      query: query ?? null,
      body: body ?? null,
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

    // Extract route from path
    const cleanPath = path.replace(/^\/api/, '');
    const pathParts = cleanPath.split('/').filter((p: string) => p);
    const route = pathParts.length > 0 ? `/${pathParts[0]}` : '/';

    // Parse URL into path params and query params
    const url = new URL(request.url, 'http://localhost');
    const queryParams: Record<string, unknown> = {};

    // Add query string params
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Add path params
    const cleanActualUrl = request.url.split('?')[0].replace(/^\/api/, '');
    const pathAfterRoute = cleanActualUrl.substring(route.length).split('/').filter((p: string) => p);

    if (pathAfterRoute.length > 0) {
      pathAfterRoute.forEach((segment, index) => {
        const key = index === 0 ? 'id' : `id${index + 1}`;
        queryParams[key] = segment;
      });
    }

    const query = Object.keys(queryParams).length > 0 ? queryParams : null;

    // Use null for unauthenticated requests
    const userId = request.user?.id ?? null;

    // Create audit log
    try {
      await this.createAuditLog(userId, action, route, query, request.body);
    } catch (err) {
      console.error('[AuditLogsService] Failed to log error:', err);
    }
  }

}
