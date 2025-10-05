import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditLogsService } from '../../services/audit-logs.service';
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

    // Skip audit logging for certain routes (these are logged explicitly in their controllers)
    const skipRoutes = [
      '/api/auth/session',
      '/api/auth/login',
      '/api/auth/logout',
      '/api-docs',
    ];

    const path = request.route?.path ?? request.url;
    if (skipRoutes.some(route => path.includes(route))) {
      return next.handle();
    }

    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        // Log successful requests (2xx status codes)
        if (response.statusCode >= 200 && response.statusCode < 300) {
          this.createAuditLog(request, user);
        }
      }),
      catchError((error: Error) => {
        // Log error requests
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        console.log('[AuditLogging] Error caught:', error.constructor.name, statusCode);
        this.auditLogsService.logApiError(request, statusCode).catch(err => {
          console.error('[AuditLogging] Failed to log error:', err);
        });
        return throwError(() => error);
      }),
    );
  }

  private createAuditLog(request: RequestWithUser, user: AuthenticatedUser | undefined, statusCode?: number): void {
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
    const baseAction = actionMap[method] ?? method;

    // Add error status to action if this is an error
    const action = statusCode ? `${baseAction}_ERROR_${statusCode}` : baseAction;

    // Extract route and entity ID from path
    const { route, entityId } = this.extractRouteInfo(path, request);

    // Use null for unauthenticated requests
    const userId = user?.id ?? null;

    console.log('[AuditLogging] Creating log:', { userId, action, route, entityId, statusCode });

    // Async fire-and-forget - don't wait for audit log to complete
    this.auditLogsService
      .createAuditLog(userId, action, route, entityId)
      .then(() => {
        console.log('[AuditLogging] Log created successfully');
      })
      .catch(err => {
        console.error('[AuditLogging] Failed to create audit log:', err);
      });
  }

  private extractRouteInfo(
    path: string,
    request: RequestWithUser,
  ): { route: string; entityId: string } {
    // Extract the base route (e.g., /users, /buildings, /bookings)
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
      return { route: baseRoute, entityId: request.body?.id ?? 'new' };
    }

    // For GET on collection endpoints
    if (request.method === 'GET') {
      return { route: baseRoute, entityId: 'collection' };
    }

    // Fallback
    return { route: baseRoute, entityId: 'unknown' };
  }
}
