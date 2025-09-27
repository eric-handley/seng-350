import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from '../database/entities/equipment.entity';
import { RoomEquipment } from '../database/entities/room-equipment.entity';
import { EquipmentResponseDto } from '../dto/equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(RoomEquipment)
    private readonly roomEquipmentRepository: Repository<RoomEquipment>,
  ) {}


  async findEquipmentByRoom(roomId: string): Promise<EquipmentResponseDto[]> {
    const roomEquipments = await this.roomEquipmentRepository.find({
      where: { room_id: roomId },
      relations: ['equipment'],
      order: { equipment: { name: 'ASC' } },
    });

    return roomEquipments.map(re => ({
      id: re.equipment.id,
      name: re.equipment.name,
      created_at: re.equipment.created_at,
      updated_at: re.equipment.updated_at,
    }));
  }

}