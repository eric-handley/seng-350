import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseBoolPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  DefaultValuePipe,
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
import { BuildingsService } from '../services/buildings.service';
import { RoomsService } from '../services/rooms.service';
import { BuildingResponseDto, CreateBuildingDto, UpdateBuildingDto } from '../dto/building.dto';
import { RoomResponseDto } from '../dto/room.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Buildings')
@ApiBearerAuth()
@Controller('buildings')
@UseGuards(AuthGuard, RolesGuard)
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

  @Get(':short_name')
  @ApiOperation({ summary: 'Get building by short name' })
  @ApiParam({ name: 'short_name', description: 'Building short name (e.g., ECS)' })
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
    @Param('short_name') short_name: string,
    @Query('includeRooms', new DefaultValuePipe(false), ParseBoolPipe) includeRooms: boolean,
  ): Promise<BuildingResponseDto> {
    return this.buildingsService.findOne(short_name, includeRooms);
  }


  @Get(':short_name/rooms')
  @ApiOperation({ summary: 'Get all rooms in a specific building' })
  @ApiParam({ name: 'short_name', description: 'Building short name (e.g., ECS)' })
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
    @Param('short_name') short_name: string,
  ): Promise<RoomResponseDto[]> {
    return this.roomsService.findByBuilding(short_name);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new building (Admin only)' })
  @ApiBody({ type: CreateBuildingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Building created successfully',
    type: BuildingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Building with this short name already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body(ValidationPipe) createBuildingDto: CreateBuildingDto,
  ): Promise<BuildingResponseDto> {
    return this.buildingsService.create(createBuildingDto);
  }

  @Patch(':short_name')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update building by short name (Admin only)' })
  @ApiParam({ name: 'short_name', description: 'Building short name (e.g., ECS)' })
  @ApiBody({ type: UpdateBuildingDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Building updated successfully',
    type: BuildingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Building not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('short_name') short_name: string,
    @Body(ValidationPipe) updateBuildingDto: UpdateBuildingDto,
  ): Promise<BuildingResponseDto> {
    return this.buildingsService.update(short_name, updateBuildingDto);
  }

  @Delete(':short_name')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete building by short name (Admin only) - Cascades to rooms and equipment' })
  @ApiParam({ name: 'short_name', description: 'Building short name (e.g., ECS)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Building deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Building not found',
  })
  async remove(@Param('short_name') short_name: string): Promise<void> {
    return this.buildingsService.remove(short_name);
  }
}