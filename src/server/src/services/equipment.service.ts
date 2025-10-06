import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from '../database/entities/equipment.entity';
import { Room } from '../database/entities/room.entity';
import { RoomEquipment } from '../database/entities/room-equipment.entity';
import { EquipmentResponseDto, CreateEquipmentDto, UpdateEquipmentDto } from '../dto/equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomEquipment)
    private readonly roomEquipmentRepository: Repository<RoomEquipment>,
  ) {}


  async findEquipmentByRoom(roomId: string): Promise<EquipmentResponseDto[]> {
    const normalizedRoomId = this.normalizeRoomId(roomId);

    // Check if room exists first
    const room = await this.roomRepository.findOne({
      where: { room_id: normalizedRoomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    const roomEquipments = await this.roomEquipmentRepository.find({
      where: { room_id: normalizedRoomId },
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

  async create(createEquipmentDto: CreateEquipmentDto): Promise<EquipmentResponseDto> {
    // Check if equipment with this name already exists
    const existing = await this.equipmentRepository.findOne({
      where: { name: createEquipmentDto.name },
    });

    if (existing) {
      throw new ConflictException(`Equipment with name '${createEquipmentDto.name}' already exists`);
    }

    const equipment = this.equipmentRepository.create(createEquipmentDto);
    const saved = await this.equipmentRepository.save(equipment);

    return {
      id: saved.id,
      name: saved.name,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
    };
  }

  async update(id: string, updateEquipmentDto: UpdateEquipmentDto): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    // Check if new name conflicts with existing equipment
    if (updateEquipmentDto.name && updateEquipmentDto.name !== equipment.name) {
      const existing = await this.equipmentRepository.findOne({
        where: { name: updateEquipmentDto.name },
      });

      if (existing) {
        throw new ConflictException(`Equipment with name '${updateEquipmentDto.name}' already exists`);
      }
    }

    Object.assign(equipment, updateEquipmentDto);
    const saved = await this.equipmentRepository.save(equipment);

    return {
      id: saved.id,
      name: saved.name,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
    };
  }

  async remove(id: string): Promise<void> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    await this.equipmentRepository.remove(equipment);
  }

  private normalizeRoomId(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new NotFoundException('Room not found');
    }

    return trimmed.toUpperCase();
  }

}
