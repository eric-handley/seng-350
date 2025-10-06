import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Building } from './entities/building.entity';
import { Room } from './entities/room.entity';
import { Equipment } from './entities/equipment.entity';
import { RoomEquipment } from './entities/room-equipment.entity';
import { Booking } from './entities/booking.entity';
import { BookingSeries } from './entities/booking-series.entity';
import { AuditLog } from './entities/audit-log.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PGHOST ?? 'localhost',
  port: parseInt(process.env.PGPORT ?? '5432'),
  username: process.env.PGUSER ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
  database: process.env.PGDATABASE ?? 'postgres',
  synchronize: false,
  logging: true,
  entities: [
    User,
    Building,
    Room,
    Equipment,
    RoomEquipment,
    Booking,
    BookingSeries,
    AuditLog,
  ],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
});