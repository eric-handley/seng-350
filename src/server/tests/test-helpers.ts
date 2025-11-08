import { Repository } from 'typeorm';
import { parseISO, set, getTime, isValid } from 'date-fns';
import { User, UserRole } from '../src/database/entities/user.entity';
import { Building } from '../src/database/entities/building.entity';
import { Room, RoomType } from '../src/database/entities/room.entity';
import { Equipment } from '../src/database/entities/equipment.entity';
import { Booking, BookingStatus } from '../src/database/entities/booking.entity';

export class TestDataFactory {
  static createUser(overrides?: Partial<User>): Partial<User> {
    return {
      email: 'test@uvic.ca',
      password_hash: 'hashedPassword123',
      first_name: 'John',
      last_name: 'Doe',
      role: UserRole.STAFF,
      ...overrides,
    };
  }

  static createBuilding(overrides?: Partial<Building>): Partial<Building> {
    return {
      name: 'Elliott Building',
      short_name: 'ELW',
      ...overrides,
    };
  }

  static createRoom(building?: Building, overrides?: Partial<Room>): Partial<Room> {
    const buildingShortName = building?.short_name ?? 'ELW';
    const roomNumber = '101';
    return {
      room_id: `${buildingShortName}-${roomNumber}`,
      building_short_name: buildingShortName,
      room_number: roomNumber,
      building,
      capacity: 30,
      room_type: RoomType.CLASSROOM,
      url: `https://example.com/${buildingShortName}/${roomNumber}`,
      ...overrides,
    };
  }

  static createEquipment(overrides?: Partial<Equipment>): Partial<Equipment> {
    return {
      name: 'Projector',
      ...overrides,
    };
  }

  static createBooking(user?: User, room?: Room, overrides?: Partial<Booking>): Partial<Booking> {
    return {
      user,
      room,
      start_time: parseISO('2024-12-01T09:00:00Z'),
      end_time: parseISO('2024-12-01T10:00:00Z'),
      status: BookingStatus.ACTIVE,
      ...overrides,
    };
  }
}

export class TestDatabaseHelper {
  static async cleanDatabase(repositories: {
    user?: Repository<User>;
    building?: Repository<Building>;
    room?: Repository<Room>;
    equipment?: Repository<Equipment>;
    booking?: Repository<Booking>;
  }) {
    // Clean in order of dependencies
    if (repositories.booking) {
      await repositories.booking.clear();
    }
    if (repositories.room) {
      await repositories.room.clear();
    }
    if (repositories.equipment) {
      await repositories.equipment.clear();
    }
    if (repositories.building) {
      await repositories.building.clear();
    }
    if (repositories.user) {
      await repositories.user.clear();
    }
  }

  static async seedTestData(repositories: {
    user: Repository<User>;
    building: Repository<Building>;
    room: Repository<Room>;
    equipment: Repository<Equipment>;
  }) {
    // Create test user
    const user = repositories.user.create(TestDataFactory.createUser());
    const savedUser = await repositories.user.save(user);

    // Create test building
    const building = repositories.building.create(TestDataFactory.createBuilding());
    const savedBuilding = await repositories.building.save(building);

    // Create test room
    const room = repositories.room.create(TestDataFactory.createRoom(savedBuilding));
    const savedRoom = await repositories.room.save(room);

    // Create test equipment
    const equipment = repositories.equipment.create(TestDataFactory.createEquipment());
    const savedEquipment = await repositories.equipment.save(equipment);

    return {
      user: savedUser,
      building: savedBuilding,
      room: savedRoom,
      equipment: savedEquipment,
    };
  }
}

export const mockUUID = '12345678-1234-1234-1234-123456789012';

export const generateMockDate = (hour = 0, minute = 0): Date => {
  const baseDate = parseISO('2025-12-01T00:00:00Z');
  return set(baseDate, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
};

export const createMockResponse = <T>(data: T) => ({
  ...data,
  created_at: generateMockDate(),
  updated_at: generateMockDate(),
});

export const expectValidUUID = (id: string) => {
  expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
};

export const expectValidDate = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  expect(dateObj).toBeInstanceOf(Date);
  expect(isValid(dateObj)).toBe(true);
};
