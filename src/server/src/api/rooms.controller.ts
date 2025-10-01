import {
  Controller,
  Get,
  Param,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomsService } from '../services/rooms.service';
import { RoomQueryDto, RoomResponseDto } from '../dto/room.dto';
import { RoomType } from '../database/entities/room.entity';
import { AuthGuard } from '../shared/guards/auth.guard';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
@UseGuards(AuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rooms with optional filters' })
  @ApiQuery({ name: 'building_id', required: false, description: 'Filter by building ID' })
  @ApiQuery({ name: 'min_capacity', required: false, description: 'Minimum room capacity' })
  @ApiQuery({ name: 'room_type', required: false, enum: RoomType, description: 'Filter by room type' })
  @ApiQuery({ name: 'equipment', required: false, description: 'Filter by equipment name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of rooms matching the filters',
    type: [RoomResponseDto],
  })
  async findAll(
    @Query(ValidationPipe) queryDto: RoomQueryDto,
  ): Promise<RoomResponseDto[]> {
    return this.roomsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room found',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomResponseDto> {
    return this.roomsService.findOne(id);
  }
}