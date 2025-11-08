import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuditLogsService } from '../../services/audit-logs.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if user is authenticated (Passport sets req.user via session)
    if (!request.user) {
      // Log 401 error before throwing
      await this.auditLogsService.logApiError(request, 401);
      throw new UnauthorizedException('Not authenticated');
   }

    return true;
  }
}
