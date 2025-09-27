import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomType } from '../database/entities/room.entity';
import { Equipment } from '../database/entities/equipment.entity';
import { RoomQueryDto, RoomResponseDto } from '../dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
  ) {}

  async findAll(queryDto: RoomQueryDto): Promise<RoomResponseDto[]> {
    const query = this.roomRepository.createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building')
      .leftJoinAndSelect('room.room_equipment', 'room_equipment')
      .leftJoinAndSelect('room_equipment.equipment', 'equipment');

    if (queryDto.building_id) {
      query.andWhere('room.building_id = :building_id', { building_id: queryDto.building_id });
    }

    if (queryDto.min_capacity) {
      query.andWhere('room.capacity >= :min_capacity', { min_capacity: queryDto.min_capacity });
    }

    if (queryDto.room_type) {
      query.andWhere('room.room_type = :room_type', { room_type: queryDto.room_type });
    }

    if (queryDto.equipment) {
      query.andWhere('equipment.name ILIKE :equipment', { equipment: `%${queryDto.equipment}%` });
    }

    query.orderBy('building.name', 'ASC').addOrderBy('room.room', 'ASC');

    const rooms = await query.getMany();
    return rooms.map(room => this.toResponseDto(room));
  }

  async findOne(id: string): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['building', 'room_equipment', 'room_equipment.equipment'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.toResponseDto(room);
  }

  async findByBuilding(buildingId: string): Promise<RoomResponseDto[]> {
    const rooms = await this.roomRepository.find({
      where: { building_id: buildingId },
      relations: ['building', 'room_equipment', 'room_equipment.equipment'],
      order: { room: 'ASC' },
    });

    return rooms.map(room => this.toResponseDto(room));
  }

  private toResponseDto(room: Room): RoomResponseDto {
    return {
      id: room.id,
      room: room.room,
      building_id: room.building_id,
      capacity: room.capacity,
      room_type: room.room_type,
      url: room.url,
      created_at: room.created_at,
      updated_at: room.updated_at,
      building: room.building ? {
        id: room.building.id,
        name: room.building.name,
        short_name: room.building.short_name,
      } : undefined,
      room_equipment: room.room_equipment?.map(re => ({
        equipment: {
          id: re.equipment.id,
          name: re.equipment.name,
        },
        quantity: re.quantity,
      })),
    };
  }
}