import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, LessThan, MoreThan } from 'typeorm';
import { Room } from '../database/entities/room.entity';
import { Equipment } from '../database/entities/equipment.entity';
import { RoomQueryDto, RoomResponseDto } from '../dto/room.dto';
import {
  ScheduleQueryDto,
  ScheduleResponseDto,
  BuildingScheduleDto,
  TimeSlotDto,
} from '../dto/schedule.dto';
import { Booking, BookingStatus } from '../database/entities/booking.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async getSchedule(
    queryDto: ScheduleQueryDto,
  ): Promise<ScheduleResponseDto> {
    const {
      room_id,
      building_short_name,
      date,
      start_time,
      end_time,
      slot_type = 'available',
    } = queryDto;

    const normalizedRoomId = this.normalizeIdentifier(room_id);
    const buildingSearch = building_short_name?.trim();

    const roomQuery = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building')
      .orderBy('building.name', 'ASC')
      .addOrderBy('room.room_number', 'ASC');

    if (normalizedRoomId) {
      roomQuery.andWhere('room.room_id = :room_id', {
        room_id: normalizedRoomId,
      });
    }
    if (buildingSearch) {
      // Search both short name and full name (case-insensitive partial match)
      roomQuery.andWhere(
        '(LOWER(building.short_name) LIKE LOWER(:buildingSearch) OR LOWER(building.name) LIKE LOWER(:buildingSearch))',
        { buildingSearch: `%${buildingSearch}%` },
      );
    }

    const rooms = await roomQuery.getMany();
    const buildingsMap: Map<string, BuildingScheduleDto> = new Map();

    // Construct query start and end times
    const dateStr = date ?? new Date().toISOString().split('T')[0];
    const startTimeStr = start_time ? start_time.replace(/-/g, ':') : '00:00:00';
    const endTimeStr = end_time ? end_time.replace(/-/g, ':') : '23:59:59';

    const queryStartTime = new Date(`${dateStr}T${startTimeStr}Z`);
    const queryEndTime = new Date(`${dateStr}T${endTimeStr}Z`);

    if (isNaN(queryStartTime.getTime()) || isNaN(queryEndTime.getTime())) {
      throw new BadRequestException('Invalid date or time format');
    }

    for (const room of rooms) {
      const bookingQuery: FindManyOptions<Booking> = {
        where: {
          room_id: room.room_id,
          status: BookingStatus.ACTIVE,
          start_time: LessThan(queryEndTime),
          end_time: MoreThan(queryStartTime),
        },
        order: { start_time: 'ASC' },
      };

      const bookings = await this.bookingRepository.find(bookingQuery);

      let slots: TimeSlotDto[] = [];

      if (slot_type === 'booked') {
        slots = bookings.map((b) => ({
          start_time: b.start_time,
          end_time: b.end_time,
        }));
      } else {
        // 'available'
        let lastEndTime = queryStartTime;

        for (const booking of bookings) {
          if (booking.start_time > lastEndTime) {
            slots.push({
              start_time: lastEndTime,
              end_time: booking.start_time,
            });
          }
          lastEndTime = new Date(
            Math.max(lastEndTime.getTime(), booking.end_time.getTime()),
          );
        }

        if (lastEndTime < queryEndTime) {
          slots.push({ start_time: lastEndTime, end_time: queryEndTime });
        }
      }

      if (!buildingsMap.has(room.building.short_name)) {
        buildingsMap.set(room.building.short_name, {
          building_short_name: room.building.short_name,
          building_name: room.building.name,
          rooms: [],
        });
      }

      const buildingDto = buildingsMap.get(room.building.short_name);
      if (buildingDto) {
        buildingDto.rooms.push({
          room_id: room.room_id,
          room_number: room.room_number,
          capacity: room.capacity,
          room_type: room.room_type,
          slots,
        });
      }
    }

    const buildings = Array.from(buildingsMap.values())
      .map(building => {
        building.rooms = building.rooms.filter(room => room.slots.length > 0);
        return building;
      })
      .filter(building => building.rooms.length > 0);

    return { buildings };
  }

  async findAll(queryDto: RoomQueryDto): Promise<RoomResponseDto[]> {
    const query = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.building', 'building')
      .leftJoinAndSelect('room.room_equipment', 'room_equipment')
      .leftJoinAndSelect('room_equipment.equipment', 'equipment');

    const normalizedBuildingShortName = this.normalizeIdentifier(
      queryDto.building_short_name,
    );

    if (normalizedBuildingShortName) {
      query.andWhere('room.building_short_name = :building_short_name', {
        building_short_name: normalizedBuildingShortName,
      });
    }

    if (queryDto.min_capacity) {
      query.andWhere('room.capacity >= :min_capacity', {
        min_capacity: queryDto.min_capacity,
      });
    }

    if (queryDto.room_type) {
      query.andWhere('room.room_type = :room_type', {
        room_type: queryDto.room_type,
      });
    }

    if (queryDto.equipment) {
      query.andWhere('equipment.name ILIKE :equipment', {
        equipment: `%${queryDto.equipment}%`,
      });
    }

    query
      .orderBy('building.name', 'ASC')
      .addOrderBy('room.room_number', 'ASC');

    const rooms = await query.getMany();
    return rooms.map((room) => this.toResponseDto(room));
  }

  async findOne(room_id: string): Promise<RoomResponseDto> {
    const normalizedRoomId = this.normalizeIdentifier(room_id);

    if (!normalizedRoomId) {
      throw new NotFoundException('Room not found');
    }

    const room = await this.roomRepository.findOne({
      where: { room_id: normalizedRoomId },
      relations: ['building', 'room_equipment', 'room_equipment.equipment'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.toResponseDto(room);
  }

  async findByBuilding(
    buildingShortName: string,
  ): Promise<RoomResponseDto[]> {
    const normalizedBuildingShortName = this.normalizeIdentifier(
      buildingShortName,
    );

    if (!normalizedBuildingShortName) {
      return [];
    }

    const rooms = await this.roomRepository.find({
      where: { building_short_name: normalizedBuildingShortName },
      relations: ['building', 'room_equipment', 'room_equipment.equipment'],
      order: { room_number: 'ASC' },
    });

    return rooms.map((room) => this.toResponseDto(room));
  }

  private normalizeIdentifier(value?: string): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed.toUpperCase() : undefined;
  }

  private toResponseDto(room: Room): RoomResponseDto {
    return {
      room_id: room.room_id,
      building_short_name: room.building_short_name,
      room_number: room.room_number,
      capacity: room.capacity,
      room_type: room.room_type,
      url: room.url,
      created_at: room.created_at,
      updated_at: room.updated_at,
      building: room.building
        ? {
            short_name: room.building.short_name,
            name: room.building.name,
          }
        : undefined,
      room_equipment: room.room_equipment?.map((re) => ({
        equipment: {
          id: re.equipment.id,
          name: re.equipment.name,
        },
        quantity: re.quantity,
      })),
    };
  }
}
