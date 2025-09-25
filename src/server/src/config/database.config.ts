import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Building } from '../database/entities/building.entity';
import { Room } from '../database/entities/room.entity';
import { Equipment } from '../database/entities/equipment.entity';
import { RoomEquipment } from '../database/entities/room-equipment.entity';
import { Booking } from '../database/entities/booking.entity';
import { BookingSeries } from '../database/entities/booking-series.entity';
import { AuditLog } from '../database/entities/audit-log.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  username: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'postgres',
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
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};