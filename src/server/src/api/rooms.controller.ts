import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomsService } from '../services/rooms.service';
import { RoomQueryDto, RoomResponseDto, CreateRoomDto, UpdateRoomDto } from '../dto/room.dto';
import { RoomType } from '../database/entities/room.entity';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
@UseGuards(AuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rooms with optional filters' })
  @ApiQuery({ name: 'building_short_name', required: false, description: 'Filter by building short name' })
  @ApiQuery({ name: 'min_capacity',  required: false, description: 'Minimum room capacity' })
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

  @Get(':room_id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'room_id', description: 'Room ID (e.g., ECS-124)' })
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
    @Param('room_id') room_id: string,
  ): Promise<RoomResponseDto> {
    return this.roomsService.findOne(room_id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new room (Admin only)' })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Room created successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Room already exists',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Building not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body(ValidationPipe) createRoomDto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    return this.roomsService.create(createRoomDto);
  }

  @Patch(':room_id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update room by ID (Admin only)' })
  @ApiParam({ name: 'room_id', description: 'Room ID (e.g., ECS-124)' })
  @ApiBody({ type: UpdateRoomDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room updated successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('room_id') room_id: string,
    @Body(ValidationPipe) updateRoomDto: UpdateRoomDto,
  ): Promise<RoomResponseDto> {
    return this.roomsService.update(room_id, updateRoomDto);
  }

  @Delete(':room_id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete room by ID (Admin only) - Cascades to equipment' })
  @ApiParam({ name: 'room_id', description: 'Room ID (e.g., ECS-124)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Room deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found',
  })
  async remove(@Param('room_id') room_id: string): Promise<void> {
    return this.roomsService.remove(room_id);
  }
}