import { BadRequestException } from '@nestjs/common';
import { Booking } from '../../src/database/entities/booking.entity';
import { BookingStatus } from '../../src/database/entities/booking.entity';
import { Building } from '../../src/database/entities/building.entity';
import { Equipment } from '../../src/database/entities/equipment.entity';
import { Room, RoomType } from '../../src/database/entities/room.entity';
import { RoomEquipment } from '../../src/database/entities/room-equipment.entity';
import { RoomsService } from '../../src/services/rooms.service';
import { Repository } from 'typeorm';
import { addDays, set } from 'date-fns';

const buildRoom = (room_id: string, room_number: string, overrides?: Partial<Room>): Room => {
  const baseDate = set(addDays(new Date(), 0), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  return {
    room_id,
    building_short_name: 'ELW',
    room_number,
    capacity: 30,
    room_type: RoomType.CLASSROOM,
    url: 'https://uvic.ca',
    created_at: baseDate,
    updated_at: baseDate,
    building: {
      short_name: 'ELW',
      name: 'Elliott Building',
    } as Building,
    room_equipment: [],
    ...overrides,
  } as Room;
};

const createEquipmentEntity = (): Equipment => {
  const baseDate = set(new Date(), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  return {
    id: 'equip-1',
    name: 'Projector',
    created_at: baseDate,
    updated_at: baseDate,
    room_equipment: [],
  } as Equipment;
};

type QueryBuilderMock = {
  leftJoinAndSelect: jest.Mock<QueryBuilderMock, [unknown?]>;
  orderBy: jest.Mock<QueryBuilderMock, [unknown?, ('ASC' | 'DESC')?]>;
  addOrderBy: jest.Mock<QueryBuilderMock, [unknown?, ('ASC' | 'DESC')?]>;
  andWhere: jest.Mock<QueryBuilderMock, [unknown?, Record<string, unknown>?]>;
  getMany: jest.Mock<Promise<Room[]>, []>;
};

const createMockQueryBuilder = (rooms: Room[]): QueryBuilderMock => {
  const builder: QueryBuilderMock = {
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    andWhere: jest.fn(),
    getMany: jest.fn(),
  };
  builder.leftJoinAndSelect.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.addOrderBy.mockReturnValue(builder);
  builder.andWhere.mockReturnValue(builder);
  builder.getMany.mockResolvedValue(rooms);
  return builder;
};

describe('RoomsService', () => {
  let roomRepository: Partial<Repository<Room>>;
  let roomCreateQueryBuilderMock: jest.Mock;
  let roomFindMock: jest.Mock;
  let bookingRepository: Partial<Repository<Booking>>;
  let bookingFindMock: jest.Mock;
  let equipmentRepository: Partial<Repository<Equipment>>;
  let buildingRepository: Partial<Repository<Building>>;
  let service: RoomsService;

  beforeEach(() => {
    roomCreateQueryBuilderMock = jest.fn();
    roomFindMock = jest.fn();
    roomRepository = {
      createQueryBuilder: roomCreateQueryBuilderMock,
      find: roomFindMock,
    };

    bookingFindMock = jest.fn();
    bookingRepository = {
      find: bookingFindMock,
    };

    equipmentRepository = {};
    buildingRepository = {};

    service = new RoomsService(
      roomRepository as unknown as Repository<Room>,
      equipmentRepository as unknown as Repository<Equipment>,
      bookingRepository as unknown as Repository<Booking>,
      buildingRepository as unknown as Repository<Building>,
    );
  });

  it('returns available slots and drops rooms without gaps', async () => {
    const roomWithAvailability = buildRoom('ELW-101', '101');
    const roomWithoutAvailability = buildRoom('ELW-102', '102');

    // Use UTC dates to match service behavior
    const tomorrow = addDays(new Date(), 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const bookings = [
      {
        room_id: roomWithAvailability.room_id,
        status: BookingStatus.ACTIVE,
        start_time: new Date(`${dateStr}T09:00:00.000Z`),
        end_time: new Date(`${dateStr}T10:00:00.000Z`),
      },
      {
        room_id: roomWithAvailability.room_id,
        status: BookingStatus.ACTIVE,
        start_time: new Date(`${dateStr}T11:00:00.000Z`),
        end_time: new Date(`${dateStr}T12:00:00.000Z`),
      },
    ];
    const fullDayBooking = {
      room_id: roomWithoutAvailability.room_id,
      status: BookingStatus.ACTIVE,
      start_time: new Date(`${dateStr}T08:00:00.000Z`),
      end_time: new Date(`${dateStr}T12:00:00.000Z`),
    };

    const queryBuilder = createMockQueryBuilder([roomWithAvailability, roomWithoutAvailability]);
    roomCreateQueryBuilderMock.mockReturnValue(queryBuilder);

    bookingFindMock.mockImplementation(async (options: { where: { room_id: string } }) => {
      return options.where.room_id === roomWithAvailability.room_id ? bookings : [fullDayBooking];
    });

    const result = await service.getSchedule({
      date: dateStr,
      start_time: '08-00-00',
      end_time: '12-00-00',
    });

    expect(result.buildings).toHaveLength(1);
    const [building] = result.buildings;
    expect(building.rooms).toHaveLength(1);
    expect(building.rooms[0].room_id).toBe(roomWithAvailability.room_id);
    expect(building.rooms[0].slots).toEqual([
      {
        start_time: new Date(`${dateStr}T08:00:00.000Z`),
        end_time: new Date(`${dateStr}T09:00:00.000Z`),
      },
      {
        start_time: new Date(`${dateStr}T10:00:00.000Z`),
        end_time: new Date(`${dateStr}T11:00:00.000Z`),
      },
    ]);
  });

  it('returns booked slots when slot_type is "booked"', async () => {
    const room = buildRoom('ELW-201', '201');
    const tomorrow = addDays(new Date(), 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const booking = {
      room_id: room.room_id,
      status: BookingStatus.ACTIVE,
      start_time: new Date(`${dateStr}T08:30:00.000Z`),
      end_time: new Date(`${dateStr}T09:30:00.000Z`),
    };

    const queryBuilder = createMockQueryBuilder([room]);
    roomCreateQueryBuilderMock.mockReturnValue(queryBuilder);
    bookingFindMock.mockResolvedValue([booking]);

    const result = await service.getSchedule({
      date: dateStr,
      start_time: '08-00-00',
      end_time: '12-00-00',
      slot_type: 'booked',
    });

    expect(result.buildings[0].rooms[0].slots).toEqual([
      {
        start_time: booking.start_time,
        end_time: booking.end_time,
      },
    ]);
  });

  it('throws BadRequestException when provided with invalid time', async () => {
    const queryBuilder = createMockQueryBuilder([]);
    roomCreateQueryBuilderMock.mockReturnValue(queryBuilder);

    await expect(
      service.getSchedule({
        start_time: '25-00-00',
        end_time: '12-00-00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('applies filters when finding rooms', async () => {
    const equipmentEntity = createEquipmentEntity();
    const room = buildRoom('ELW-301', '301');
    const baseDate = set(new Date(), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    const roomEquipment = {
      room_id: room.room_id,
      equipment_id: equipmentEntity.id,
      quantity: 2,
      created_at: baseDate,
      updated_at: baseDate,
      room,
      equipment: equipmentEntity,
    } as RoomEquipment;
    room.room_equipment = [roomEquipment];
    const queryBuilder = createMockQueryBuilder([room]);
    roomCreateQueryBuilderMock.mockReturnValue(queryBuilder);

    const result = await service.findAll({
      building_short_name: 'elw',
      min_capacity: 10,
      room_type: RoomType.CLASSROOM,
      equipment: 'projector',
    });

    const andWhereMock = queryBuilder.andWhere as jest.Mock;
    expect(andWhereMock).toHaveBeenCalledWith(
      'room.building_short_name = :building_short_name',
      { building_short_name: 'ELW' },
    );
    expect(andWhereMock).toHaveBeenCalledWith(
      'room.capacity >= :min_capacity',
      { min_capacity: 10 },
    );
    expect(andWhereMock).toHaveBeenCalledWith('room.room_type = :room_type', {
      room_type: RoomType.CLASSROOM,
    });
    expect(andWhereMock).toHaveBeenCalledWith('equipment.name ILIKE :equipment', {
      equipment: '%projector%',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      room_id: 'ELW-301',
      building: {
        short_name: 'ELW',
        name: 'Elliott Building',
      },
      room_equipment: [
        {
          equipment: { id: 'equip-1', name: 'Projector' },
          quantity: 2,
        },
      ],
    });
  });

  it('returns empty list when building short name is invalid', async () => {
    const rooms = await service.findByBuilding('   ');
    expect(rooms).toEqual([]);
    expect(roomFindMock).not.toHaveBeenCalled();
  });
});
