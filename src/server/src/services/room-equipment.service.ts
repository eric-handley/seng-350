import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomEquipment } from '../database/entities/room-equipment.entity';
import { Room } from '../database/entities/room.entity';
import { Equipment } from '../database/entities/equipment.entity';
import {
  RoomEquipmentResponseDto,
  CreateRoomEquipmentDto,
  UpdateRoomEquipmentDto,
} from '../dto/room-equipment.dto';

@Injectable()
export class RoomEquipmentService {
  constructor(
    @InjectRepository(RoomEquipment)
    private readonly roomEquipmentRepository: Repository<RoomEquipment>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
  ) {}

  async create(createRoomEquipmentDto: CreateRoomEquipmentDto): Promise<RoomEquipmentResponseDto> {
    const normalizedRoomId = this.normalizeRoomId(createRoomEquipmentDto.room_id);

    // Check if room exists
    const room = await this.roomRepository.findOne({
      where: { room_id: normalizedRoomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${createRoomEquipmentDto.room_id} not found`);
    }

    // Check if equipment exists
    const equipment = await this.equipmentRepository.findOne({
      where: { id: createRoomEquipmentDto.equipment_id },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${createRoomEquipmentDto.equipment_id} not found`);
    }

    // Check if this room-equipment relationship already exists
    const existing = await this.roomEquipmentRepository.findOne({
      where: {
        room_id: normalizedRoomId,
        equipment_id: createRoomEquipmentDto.equipment_id,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Equipment ${createRoomEquipmentDto.equipment_id} already exists in room ${createRoomEquipmentDto.room_id}`
      );
    }

    const roomEquipment = this.roomEquipmentRepository.create({
      room_id: normalizedRoomId,
      equipment_id: createRoomEquipmentDto.equipment_id,
      quantity: createRoomEquipmentDto.quantity ?? null,
    });

    const saved = await this.roomEquipmentRepository.save(roomEquipment);

    return {
      room_id: saved.room_id,
      equipment_id: saved.equipment_id,
      quantity: saved.quantity,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
    };
  }

  async update(
    roomId: string,
    equipmentId: string,
    updateRoomEquipmentDto: UpdateRoomEquipmentDto,
  ): Promise<RoomEquipmentResponseDto> {
    const normalizedRoomId = this.normalizeRoomId(roomId);

    const roomEquipment = await this.roomEquipmentRepository.findOne({
      where: {
        room_id: normalizedRoomId,
        equipment_id: equipmentId,
      },
    });

    if (!roomEquipment) {
      throw new NotFoundException(
        `Room-Equipment relationship not found for room ${roomId} and equipment ${equipmentId}`
      );
    }

    Object.assign(roomEquipment, updateRoomEquipmentDto);
    const saved = await this.roomEquipmentRepository.save(roomEquipment);

    return {
      room_id: saved.room_id,
      equipment_id: saved.equipment_id,
      quantity: saved.quantity,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
    };
  }

  async remove(roomId: string, equipmentId: string): Promise<void> {
    const normalizedRoomId = this.normalizeRoomId(roomId);

    const roomEquipment = await this.roomEquipmentRepository.findOne({
      where: {
        room_id: normalizedRoomId,
        equipment_id: equipmentId,
      },
    });

    if (!roomEquipment) {
      throw new NotFoundException(
        `Room-Equipment relationship not found for room ${roomId} and equipment ${equipmentId}`
      );
    }

    await this.roomEquipmentRepository.remove(roomEquipment);
  }

  private normalizeRoomId(value: string): string {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new NotFoundException('Room not found');
    }

    return trimmed.toUpperCase();
  }
}
