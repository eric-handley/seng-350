import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditLogsService } from '../../services/audit-logs.service';
import { EntityType } from '../../database/entities/audit-log.entity';
import { AuthenticatedUser } from '../../auth/auth.service';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip audit logging for certain routes
    const skipRoutes = [
      '/api/auth/session',
      '/api/audit-logs',
      '/api-docs',
    ];

    const path = request.route?.path ?? request.url;
    if (skipRoutes.some(route => path.includes(route))) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // Only log successful requests (2xx status codes)
        if (response.statusCode >= 200 && response.statusCode < 300) {
          const user = request.user;
          this.createAuditLog(request, user);
        }
      }),
    );
  }

  private createAuditLog(request: RequestWithUser, user: AuthenticatedUser | undefined): void {
    const method = request.method;
    const path = request.route?.path ?? request.url;

    // Determine action from HTTP method
    const actionMap: Record<string, string> = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    const action = actionMap[method] ?? method;

    // Extract entity type and ID from route
    const { entityType, entityId } = this.extractEntityInfo(path, request);

    if (entityType && entityId) {
      // Use a special user ID for unauthenticated requests
      const userId = user?.id ?? '00000000-0000-0000-0000-000000000000';

      // Async fire-and-forget - don't wait for audit log to complete
      this.auditLogsService
        .createAuditLog(userId, action, entityType, entityId)
        .catch(err => {
          console.error('Failed to create audit log:', err);
        });
    }
  }

  private extractEntityInfo(
    path: string,
    request: RequestWithUser,
  ): { entityType: EntityType | null; entityId: string | null } {
    // Route pattern matching
    const patterns: Array<{
      regex: RegExp;
      entityType: EntityType;
      idExtractor: (match: RegExpMatchArray, request: RequestWithUser) => string | null;
    }> = [
      {
        regex: /\/users\/([^\/]+)/,
        entityType: EntityType.USER,
        idExtractor: (match) => match[1],
      },
      {
        regex: /\/users$/,
        entityType: EntityType.USER,
        idExtractor: (_, req) => req.body?.id ?? req.body?.email ?? 'unknown',
      },
      {
        regex: /\/bookings\/([^\/]+)/,
        entityType: EntityType.BOOKING,
        idExtractor: (match) => match[1],
      },
      {
        regex: /\/bookings$/,
        entityType: EntityType.BOOKING,
        idExtractor: (_, req) => req.body?.id ?? 'new',
      },
      {
        regex: /\/rooms\/([^\/]+)/,
        entityType: EntityType.ROOM,
        idExtractor: (match) => match[1],
      },
      {
        regex: /\/buildings\/([^\/]+)/,
        entityType: EntityType.BUILDING,
        idExtractor: (match) => match[1],
      },
      {
        regex: /\/equipment\/([^\/]+)/,
        entityType: EntityType.EQUIPMENT,
        idExtractor: (match) => match[1],
      },
      {
        regex: /\/equipment$/,
        entityType: EntityType.EQUIPMENT,
        idExtractor: (_, req) => req.body?.id ?? 'new',
      },
    ];

    for (const pattern of patterns) {
      const match = path.match(pattern.regex);
      if (match) {
        const entityId = pattern.idExtractor(match, request);
        return {
          entityType: pattern.entityType,
          entityId: entityId ?? 'unknown',
        };
      }
    }

    return { entityType: null, entityId: null };
  }
}
