import {
  Controller,
  Get,
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
import { EquipmentService } from '../services/equipment.service';
import { EquipmentResponseDto, CreateEquipmentDto, UpdateEquipmentDto } from '../dto/equipment.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Equipment')
@ApiBearerAuth()
@Controller('equipment')
@UseGuards(AuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get('room/:room_id')
  @ApiOperation({ summary: 'Get all equipment in a specific room' })
  @ApiParam({ name: 'room_id', description: 'Room ID, building_short_name + room_number (e.g. ECS-116)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of equipment in the room',
    type: [EquipmentResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found or no equipment in room',
  })
  async findEquipmentByRoom(
    @Param('room_id') room_id: string,
  ): Promise<EquipmentResponseDto[]> {
    return this.equipmentService.findEquipmentByRoom(room_id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new equipment (Admin only)' })
  @ApiBody({ type: CreateEquipmentDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Equipment created successfully',
    type: EquipmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Equipment with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body(ValidationPipe) createEquipmentDto: CreateEquipmentDto,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update equipment by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Equipment ID (UUID)' })
  @ApiBody({ type: UpdateEquipmentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Equipment updated successfully',
    type: EquipmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Equipment not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Equipment with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEquipmentDto: UpdateEquipmentDto,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete equipment by ID (Admin only) - Cascades to room_equipment' })
  @ApiParam({ name: 'id', description: 'Equipment ID (UUID)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Equipment deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Equipment not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.equipmentService.remove(id);
  }
}