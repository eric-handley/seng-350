import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisCacheModule } from '../shared/cache/cache.module';
import { AuthModule } from '../auth/auth.module';

// Import entities
import { User } from '../database/entities/user.entity';
import { Building } from '../database/entities/building.entity';
import { Room } from '../database/entities/room.entity';
import { Equipment } from '../database/entities/equipment.entity';
import { RoomEquipment } from '../database/entities/room-equipment.entity';
import { Booking } from '../database/entities/booking.entity';
import { BookingSeries } from '../database/entities/booking-series.entity';
import { AuditLog } from '../database/entities/audit-log.entity';

// Import controllers
import { UsersController } from '../api/users.controller';
import { BookingsController } from '../api/bookings.controller';
import { RoomsController } from '../api/rooms.controller';
import { BuildingsController } from '../api/buildings.controller';
import { EquipmentController } from '../api/equipment.controller';

// Import services
import { UsersService } from '../services/users.service';
import { BookingsService } from '../services/bookings.service';
import { RoomsService } from '../services/rooms.service';
import { BuildingsService } from '../services/buildings.service';
import { EquipmentService } from '../services/equipment.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PGHOST ?? 'db',
      port: Number(process.env.PGPORT ?? 5432),
      username: process.env.PGUSER ?? 'postgres',
      password: process.env.PGPASSWORD ?? 'postgres',
      database: process.env.PGDATABASE ?? 'postgres',
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
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([
      User,
      Building,
      Room,
      Equipment,
      RoomEquipment,
      Booking,
      BookingSeries,
      AuditLog,
    ]),
    RedisCacheModule,
    AuthModule,
  ],
  controllers: [
    AppController,
    UsersController,
    BookingsController,
    RoomsController,
    BuildingsController,
    EquipmentController,
  ],
  providers: [
    AppService,
    UsersService,
    BookingsService,
    RoomsService,
    BuildingsService,
    EquipmentService,
  ],
})
export class AppModule {}