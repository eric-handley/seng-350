import {
  Controller,
  Get,
  Param,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EquipmentService } from '../services/equipment.service';
import { EquipmentResponseDto } from '../dto/equipment.dto';
import { AuthGuard } from '../shared/guards/auth.guard';

@ApiTags('Equipment')
@ApiBearerAuth()
@Controller('equipment')
@UseGuards(AuthGuard)
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
    @Param('roomId') roomId: string,
  ): Promise<EquipmentResponseDto[]> {
    return this.equipmentService.findEquipmentByRoom(roomId);
  }
}