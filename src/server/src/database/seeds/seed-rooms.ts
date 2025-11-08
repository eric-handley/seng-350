import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Building } from '../entities/building.entity';
import { Room, RoomType } from '../entities/room.entity';
import { Equipment } from '../entities/equipment.entity';
import { RoomEquipment } from '../entities/room-equipment.entity';
import { User } from '../entities/user.entity';
import { Booking } from '../entities/booking.entity';
import { BookingSeries } from '../entities/booking-series.entity';
import { AuditLog } from '../entities/audit-log.entity';

interface RoomData {
  room_number: string;
  building: {
    name: string;
    short_name: string;
  };
  capacity: number;
  room_type: string;
  room_equipment: Array<{
    name: string;
    quantity: number;
  }>;
  url: string;
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PGHOST ?? 'localhost',
  port: parseInt(process.env.PGPORT ?? '5432'),
  username: process.env.PGUSER ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
  database: process.env.PGDATABASE ?? 'postgres',
  synchronize: false,
  logging: true,
  entities: [User, Building, Room, Equipment, RoomEquipment, Booking, BookingSeries, AuditLog],
});

function mapRoomType(roomType: string): RoomType {
  switch (roomType.toLowerCase()) {
    case 'classroom':
      return RoomType.CLASSROOM;
    case 'lecture theatre':
      return RoomType.LECTURE_THEATRE;
    case 'multi access classroom':
    case 'multi-access classroom':
      return RoomType.MULTI_ACCESS_CLASSROOM;
    case 'flury hall':
      return RoomType.FLURY_HALL;
    case 'david lam auditorium':
      return RoomType.DAVID_LAM_AUDITORIUM;
    default:
      console.warn(`Unknown room type: ${roomType}, using UNKNOWN`);
      return RoomType.UNKNOWN;
  }
}

async function main() {
  try {
    await AppDataSource.initialize();

    const dataPath = path.join(__dirname, '../../../data/uvic_rooms.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const roomsData: RoomData[] = JSON.parse(rawData);


    const buildingRepository = AppDataSource.getRepository(Building);
    const roomRepository = AppDataSource.getRepository(Room);
    const equipmentRepository = AppDataSource.getRepository(Equipment);
    const roomEquipmentRepository = AppDataSource.getRepository(RoomEquipment);

    // Check if data already exists to avoid unnecessary processing
    const existingBuildingsCount = await buildingRepository.count();
    const existingRoomsCount = await roomRepository.count();
    const existingEquipmentCount = await equipmentRepository.count();
    if (existingBuildingsCount > 0 && existingRoomsCount > 0 && existingEquipmentCount > 0) {
      return;
    }

    const buildingMap = new Map<string, Building>();
    const equipmentMap = new Map<string, Equipment>();

    for (const roomData of roomsData) {
      try {
        let building = buildingMap.get(roomData.building.short_name);
        if (!building) {
          building = await buildingRepository.findOne({
            where: { short_name: roomData.building.short_name }
          }) ?? undefined;
          
          if (!building) {
            building = buildingRepository.create({
              name: roomData.building.name,
              short_name: roomData.building.short_name
            });
            building = await buildingRepository.save(building);
          }
          
          buildingMap.set(building.short_name, building);
        }

        const roomType = mapRoomType(roomData.room_type);

        const room_id = `${building.short_name}-${roomData.room_number}`;

        const existingRoom = await roomRepository.findOne({
          where: { room_id }
        });

        if (existingRoom) {
          continue;
        }

        const room = roomRepository.create({
          room_id,
          building_short_name: building.short_name,
          room_number: roomData.room_number,
          capacity: roomData.capacity,
          room_type: roomType,
          url: roomData.url
        });

        const savedRoom = await roomRepository.save(room);

        for (const equipmentData of roomData.room_equipment) {
          let equipment = equipmentMap.get(equipmentData.name);
          if (!equipment) {
            equipment = await equipmentRepository.findOne({
              where: { name: equipmentData.name }
            }) ?? undefined;
            
            if (!equipment) {
              equipment = equipmentRepository.create({
                name: equipmentData.name
              });
              equipment = await equipmentRepository.save(equipment);
            }
            
            equipmentMap.set(equipment.name, equipment);
          }

          const roomEquipment = roomEquipmentRepository.create({
            room_id: savedRoom.room_id,
            equipment_id: equipment.id,
            quantity: equipmentData.quantity
          });

          await roomEquipmentRepository.save(roomEquipment);
        }

      } catch (error) {
        console.error(`Error processing room ${roomData.room_number}:`, error);
      }
    }

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  main();
}
