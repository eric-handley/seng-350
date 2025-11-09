import {
  Controller,
  Get,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from '../services/audit-logs.service';
import { AuditLogResponseDto } from '../dto/audit-log.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { ParseDatePipe } from '../shared/pipes/parse-date.pipe';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('logs')
@UseGuards(AuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit logs with optional filters (Admin only)' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action (e.g., CREATE, READ, LOGIN)' })
  @ApiQuery({ name: 'route', required: false, description: 'Filter by route (e.g., bookings, users)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'startTime', required: false, description: 'Filter logs created after this time (ISO 8601)' })
  @ApiQuery({ name: 'endTime', required: false, description: 'Filter logs created before this time (ISO 8601)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip (for pagination)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of records to return' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of audit logs',
    type: [AuditLogResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Admin role required',
  })
  async findAll(
    @Query('action') action?: string,
    @Query('route') route?: string,
    @Query('userId') userId?: string,
    @Query('startTime', ParseDatePipe) startTime?: Date,
    @Query('endTime', ParseDatePipe) endTime?: Date,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ): Promise<AuditLogResponseDto[]> {
    return this.auditLogsService.findAll({
      action,
      route,
      userId,
      startTime,
      endTime,
      offset: offset ? parseInt(offset, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
