import 'reflect-metadata';
import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import { Building } from '../entities/building.entity';
import { Room } from '../entities/room.entity';
import { Equipment } from '../entities/equipment.entity';
import { RoomEquipment } from '../entities/room-equipment.entity';
import { Booking } from '../entities/booking.entity';
import { BookingSeries } from '../entities/booking-series.entity';
import { AuditLog } from '../entities/audit-log.entity';

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

async function main() {
  try {
    await AppDataSource.initialize();

    const userRepository = AppDataSource.getRepository(User);

    // Check if data already exists to avoid unnecessary processing
    const existingUsersCount = await userRepository.count();
    if (existingUsersCount > 0) {
      return;
    }

    const demoUsers = [
      {
        email: 'admin@uvic.ca',
        password: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        role: UserRole.ADMIN,
      },
      {
        email: 'staff@uvic.ca',
        password: 'staff',
        first_name: 'Staff',
        last_name: 'User',
        role: UserRole.STAFF,
      },
      {
        email: 'registrar@uvic.ca',
        password: 'registrar',
        first_name: 'Registrar',
        last_name: 'User',
        role: UserRole.REGISTRAR,
      },
    ];

    for (const userData of demoUsers) {
      const password_hash = await bcrypt.hash(userData.password, 10);

      const user = userRepository.create({
        email: userData.email,
        password_hash,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
      });

      await userRepository.save(user);
      console.log(`Created user: ${userData.email}`);
    }

    console.log('Demo users seeding completed successfully');
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
