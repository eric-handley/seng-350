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
        this.auditLogsService.logApiError(request, statusCode).catch(err => {
          console.error('[AuditLogging] Failed to log error:', err);
        });
        return throwError(() => error);
      }),
    );
  }

  private createAuditLog(request: RequestWithUser, user: AuthenticatedUser | undefined, statusCode?: number): void {
    const method = request.method;
    const routePath = request.route?.path ?? request.url;
    const actualUrl = request.url;

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

    // Extract route from path (route template, e.g., /api/bookings)
    const cleanPath = routePath.replace(/^\/api/, '');
    const pathParts = cleanPath.split('/').filter((p: string) => p);
    const route = pathParts.length > 0 ? `/${pathParts[0]}` : '/';

    // Parse URL into path params and query params
    // Example: /api/bookings/abc-123?force=true -> { id: 'abc-123', force: 'true' }
    const url = new URL(actualUrl, 'http://localhost');
    const queryParams: Record<string, any> = {};

    // Add query string params
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Add path params (everything between route and query string)
    const cleanActualUrl = actualUrl.split('?')[0].replace(/^\/api/, '');
    const pathAfterRoute = cleanActualUrl.substring(route.length).split('/').filter((p: string) => p);

    // If there are path segments, add them with keys like id, id2, etc.
    if (pathAfterRoute.length > 0) {
      pathAfterRoute.forEach((segment, index) => {
        const key = index === 0 ? 'id' : `id${index + 1}`;
        queryParams[key] = segment;
      });
    }

    const query = Object.keys(queryParams).length > 0 ? queryParams : null;

    // Use null for unauthenticated requests
    const userId = user?.id ?? null;

    console.log('[AuditLogging] Creating log:', { userId, action, route, query, statusCode });

    // Async fire-and-forget - don't wait for audit log to complete
    this.auditLogsService
      .createAuditLog(userId, action, route, query, request.body)
      .then(() => {
        console.log('[AuditLogging] Log created successfully');
      })
      .catch(err => {
        console.error('[AuditLogging] Failed to create audit log:', err);
      });
  }

}
