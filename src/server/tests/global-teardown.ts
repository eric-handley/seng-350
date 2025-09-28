import { DataSource } from 'typeorm';
import { User } from '../src/database/entities/user.entity';
import { Booking } from '../src/database/entities/booking.entity';
import { BookingSeries } from '../src/database/entities/booking-series.entity';
import { AuditLog } from '../src/database/entities/audit-log.entity';
import { Building } from '../src/database/entities/building.entity';
import { Room } from '../src/database/entities/room.entity';
import { Equipment } from '../src/database/entities/equipment.entity';
import { RoomEquipment } from '../src/database/entities/room-equipment.entity';

export default async function globalTeardown() {
  // Prefer explicit TEST env; fall back to standard env vars
  // Match integration test defaults: localhost:5433, test/test, test_db
  const host = process.env.PGHOST_TEST ?? process.env.PGHOST ?? 'localhost';
  const port = Number(process.env.PGPORT_TEST ?? process.env.PGPORT ?? 5433);
  const username = process.env.PGUSER_TEST ?? process.env.PGUSER ?? 'test';
  const password = process.env.PGPASSWORD_TEST ?? process.env.PGPASSWORD ?? 'test';
  const database = process.env.PGDATABASE_TEST ?? process.env.PGDATABASE ?? 'test_db';

  const ds = new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    // Entities are not required for raw queries, but included for completeness
    entities: [User, Booking, BookingSeries, AuditLog, Building, Room, Equipment, RoomEquipment],
  });

  try {
    // Hard safety: never operate on non-test DBs
    const dbName = String(database).toLowerCase();
    if (!dbName.includes('test')) {
      console.warn(`Global teardown skipped: refusing to clean non-test DB '${database}'.`);
      return;
    }

    await ds.initialize();
    // Clear only test-created data, preserve seed data (buildings, rooms, equipment)
    // Use CASCADE to handle foreign key dependencies
    await ds.query('TRUNCATE TABLE "bookings", "booking_series", "audit_logs" RESTART IDENTITY CASCADE');
    await ds.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
  } catch (err) {
     
    console.error('Global teardown cleanup failed:', err);
  } finally {
    await ds.destroy();
  }
}
