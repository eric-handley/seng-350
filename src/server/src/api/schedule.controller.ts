import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomsService } from '../services/rooms.service';
import { AuthenticatedGuard } from '../shared/guards/authenticated.guard';
import { ScheduleQueryDto, ScheduleResponseDto } from '../dto/schedule.dto';

@ApiTags('Schedule')
@ApiBearerAuth()
@Controller('schedule')
@UseGuards(AuthenticatedGuard)
export class ScheduleController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get available or booked time slots for rooms, organized by building',
  })
  @ApiQuery({ name: 'room_id', required: false, description: 'Filter by room ID (e.g., 123, ECS-124, ECS)' })
  @ApiQuery({ name: 'building_short_name', required: false, description: 'Filter by building short name or full name (e.g., "ECS", "Engineering", "Clearihue")' })
  @ApiQuery({ name: 'date', required: false, type: 'string', description: 'Filter by date (YYYY-MM-DD). Defaults to today.' })
  @ApiQuery({ name: 'start_time', required: false, type: 'string', description: 'Query range start time (hh-mm-ss). Defaults to 00-00-00.' })
  @ApiQuery({ name: 'end_time', required: false, type: 'string', description: 'Query range end time (hh-mm-ss). Defaults to 23-59-59.' })
  @ApiQuery({ name: 'slot_type', required: false, enum: ['available', 'booked'], description: 'Type of slots to return. "available" shows free/unbooked times. "booked" shows occupied/scheduled times. Default: "available"' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Schedule with time slots organized by building and room', type: ScheduleResponseDto })
  async getSchedule(
    @Query(ValidationPipe) queryDto: ScheduleQueryDto,
  ): Promise<ScheduleResponseDto> {
    return this.roomsService.getSchedule(queryDto);
  }
}
