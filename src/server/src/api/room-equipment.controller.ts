import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomEquipmentService } from '../services/room-equipment.service';
import {
  RoomEquipmentResponseDto,
  CreateRoomEquipmentDto,
  UpdateRoomEquipmentDto,
} from '../dto/room-equipment.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Room Equipment')
@ApiBearerAuth()
@Controller('room-equipment')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RoomEquipmentController {
  constructor(private readonly roomEquipmentService: RoomEquipmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add equipment to a room (Admin only)' })
  @ApiBody({ type: CreateRoomEquipmentDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Equipment added to room successfully',
    type: RoomEquipmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room or equipment not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Equipment already exists in this room',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body(ValidationPipe) createRoomEquipmentDto: CreateRoomEquipmentDto,
  ): Promise<RoomEquipmentResponseDto> {
    return this.roomEquipmentService.create(createRoomEquipmentDto);
  }

  @Patch(':room_id/:equipment_id')
  @ApiOperation({ summary: 'Update room-equipment relationship (Admin only)' })
  @ApiParam({ name: 'room_id', description: 'Room ID (e.g., ECS-124)' })
  @ApiParam({ name: 'equipment_id', description: 'Equipment ID (UUID)' })
  @ApiBody({ type: UpdateRoomEquipmentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room-equipment relationship updated successfully',
    type: RoomEquipmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room-equipment relationship not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('room_id') room_id: string,
    @Param('equipment_id') equipment_id: string,
    @Body(ValidationPipe) updateRoomEquipmentDto: UpdateRoomEquipmentDto,
  ): Promise<RoomEquipmentResponseDto> {
    return this.roomEquipmentService.update(room_id, equipment_id, updateRoomEquipmentDto);
  }

  @Delete(':room_id/:equipment_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove equipment from room (Admin only)' })
  @ApiParam({ name: 'room_id', description: 'Room ID (e.g., ECS-124)' })
  @ApiParam({ name: 'equipment_id', description: 'Equipment ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Equipment removed from room successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room-equipment relationship not found',
  })
  async remove(
    @Param('room_id') room_id: string,
    @Param('equipment_id') equipment_id: string,
  ): Promise<void> {
    return this.roomEquipmentService.remove(room_id, equipment_id);
  }
}
