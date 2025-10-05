import {
  Controller,
  Get,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditLogsService } from '../services/audit-logs.service';
import { AuditLogResponseDto } from '../dto/audit-log.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('logs')
@UseGuards(AuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all audit logs (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all audit logs',
    type: [AuditLogResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Admin role required',
  })
  async findAll(): Promise<AuditLogResponseDto[]> {
    return this.auditLogsService.findAll();
  }
}
