import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from '../database/entities/building.entity';
import { BuildingResponseDto } from '../dto/building.dto';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
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

    const building = await this.buildingRepository.findOne({
      where: { short_name },
      relations,
    });

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    return this.toResponseDto(building, includeRooms);
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
}