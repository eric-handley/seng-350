import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuditLogsService } from '../../services/audit-logs.service';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if user is authenticated (Passport sets req.isAuthenticated())
    if (!request.isAuthenticated()) {
      // Log 401 error before throwing
      await this.auditLogsService.logApiError(request, 401);
      throw new UnauthorizedException('Authentication required');
    }

    return true;
  }
}
