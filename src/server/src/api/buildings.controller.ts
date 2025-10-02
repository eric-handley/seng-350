import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  ParseBoolPipe,
  HttpStatus,
  DefaultValuePipe,
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
import { BuildingsService } from '../services/buildings.service';
import { RoomsService } from '../services/rooms.service';
import { BuildingResponseDto } from '../dto/building.dto';
import { RoomResponseDto } from '../dto/room.dto';
import { AuthGuard } from '../shared/guards/auth.guard';

@ApiTags('Buildings')
@ApiBearerAuth()
@Controller('buildings')
@UseGuards(AuthGuard)
export class BuildingsController {
  constructor(
    private readonly buildingsService: BuildingsService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all buildings' })
  @ApiQuery({ 
    name: 'includeRooms', 
    required: false, 
    type: Boolean, 
    description: 'Include rooms data in the response',
    example: false 
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all buildings',
    type: [BuildingResponseDto],
  })
  async findAll(
    @Query('includeRooms', new DefaultValuePipe(false), ParseBoolPipe) includeRooms: boolean,
  ): Promise<BuildingResponseDto[]> {
    return this.buildingsService.findAll(includeRooms);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get building by ID' })
  @ApiParam({ name: 'id', description: 'Building UUID' })
  @ApiQuery({ 
    name: 'includeRooms', 
    required: false, 
    type: Boolean, 
    description: 'Include rooms data in the response',
    example: false 
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Building found',
    type: BuildingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Building not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeRooms', new DefaultValuePipe(false), ParseBoolPipe) includeRooms: boolean,
  ): Promise<BuildingResponseDto> {
    return this.buildingsService.findOne(id, includeRooms);
  }


  @Get(':id/rooms')
  @ApiOperation({ summary: 'Get all rooms in a specific building' })
  @ApiParam({ name: 'id', description: 'Building UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of rooms in the building',
    type: [RoomResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Building not found',
  })
  async findRoomsByBuilding(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomResponseDto[]> {
    return this.roomsService.findByBuilding(id);
  }
}