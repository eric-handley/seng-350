import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { EquipmentService } from '../services/equipment.service';
import { EquipmentResponseDto } from '../dto/equipment.dto';

@ApiTags('Equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get all equipment in a specific room' })
  @ApiParam({ name: 'roomId', description: 'Room UUID' })
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
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<EquipmentResponseDto[]> {
    return this.equipmentService.findEquipmentByRoom(roomId);
  }
}