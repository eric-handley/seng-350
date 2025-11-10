import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from '../database/entities/building.entity';
import { BuildingResponseDto, CreateBuildingDto, UpdateBuildingDto } from '../dto/building.dto';
import { CacheService } from '../shared/cache/cache.service';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(includeRooms = false): Promise<BuildingResponseDto[]> {
    const relations = includeRooms ? ['rooms', 'rooms.room_equipment', 'rooms.room_equipment.equipment'] : [];
    
    const buildings = await this.buildingRepository.find({
      relations,
      order: { name: 'ASC' },
    });

    return buildings.map(building => this.toResponseDto(building, includeRooms));
  }

  async findOne(short_name: string, includeRooms = false): Promise<BuildingResponseDto> {
    const relations = includeRooms ? ['rooms', 'rooms.room_equipment', 'rooms.room_equipment.equipment'] : [];

    const normalizedShortName = this.normalizeShortName(short_name);

    const building = await this.buildingRepository.findOne({
      where: { short_name: normalizedShortName },
      relations,
    });

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    return this.toResponseDto(building, includeRooms);
  }

  async create(createBuildingDto: CreateBuildingDto): Promise<BuildingResponseDto> {
    const normalizedShortName = this.normalizeShortName(createBuildingDto.short_name);

    // Check if building already exists
    const existingBuilding = await this.buildingRepository.findOne({
      where: { short_name: normalizedShortName },
    });

    if (existingBuilding) {
      throw new ConflictException('Building with this short name already exists');
    }

    const building = this.buildingRepository.create({
      short_name: normalizedShortName,
      name: createBuildingDto.name.trim(),
    });

    const savedBuilding = await this.buildingRepository.save(building);

    // Invalidate building-related caches since a building has been created
    await this.cacheService.clearBuildingCache();

    return this.toResponseDto(savedBuilding);
  }

  async update(short_name: string, updateBuildingDto: UpdateBuildingDto): Promise<BuildingResponseDto> {
    const normalizedShortName = this.normalizeShortName(short_name);

    const building = await this.buildingRepository.findOne({
      where: { short_name: normalizedShortName },
    });

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    building.name = updateBuildingDto.name.trim();

    const savedBuilding = await this.buildingRepository.save(building);

    // Invalidate building-related caches since a building has been updated
    await this.cacheService.clearBuildingCache();

    return this.toResponseDto(savedBuilding);
  }

  async remove(short_name: string): Promise<void> {
    const normalizedShortName = this.normalizeShortName(short_name);

    const building = await this.buildingRepository.findOne({
      where: { short_name: normalizedShortName },
    });

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    await this.buildingRepository.remove(building);

    // Invalidate building-related caches since a building has been removed
    await this.cacheService.clearBuildingCache();
  }


  private toResponseDto(building: Building, includeRooms = false): BuildingResponseDto {
    const response: BuildingResponseDto = {
      short_name: building.short_name,
      name: building.name,
      created_at: building.created_at,
      updated_at: building.updated_at,
    };

    if (includeRooms && building.rooms) {
      response.rooms = building.rooms
        .sort((a, b) => a.room_number.localeCompare(b.room_number))
        .map(room => ({
          room_id: room.room_id,
          building_short_name: room.building_short_name,
          room_number: room.room_number,
          capacity: room.capacity,
          room_type: room.room_type,
          url: room.url,
          created_at: room.created_at,
          updated_at: room.updated_at,
          room_equipment: room.room_equipment?.map(re => ({
            equipment: {
              id: re.equipment.id,
              name: re.equipment.name,
            },
            quantity: re.quantity,
          })),
        }));
    }

    return response;
  }

  private normalizeShortName(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new NotFoundException('Building not found');
    }

    return trimmed.toUpperCase();
  }
}
