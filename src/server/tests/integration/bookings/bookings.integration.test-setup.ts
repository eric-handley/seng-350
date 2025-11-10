// Ensure AppModule connects to the dedicated test services
(() => {
  process.env.PGHOST = process.env.PGHOST_TEST ?? 'localhost';
  process.env.PGPORT = process.env.PGPORT_TEST ?? '5433';
  process.env.PGUSER = process.env.PGUSER_TEST ?? 'test';
  process.env.PGPASSWORD = process.env.PGPASSWORD_TEST ?? 'test';
  process.env.PGDATABASE = process.env.PGDATABASE_TEST ?? 'test_db';
  process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
  process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
})();

import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException, ExecutionContext } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { addDays, set } from 'date-fns';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { Booking } from '../../../src/database/entities/booking.entity';
import { GlobalExceptionFilter } from '../../../src/filters/global-exception.filter';

// Helper functions for date manipulation in tests
export const createTomorrow = () => addDays(new Date(), 1);
export const setTime = (date: Date, hours: number, minutes = 0, seconds = 0) =>
  set(date, { hours, minutes, seconds, milliseconds: 0 });

export interface BookingsTestContext {
  app: INestApplication;
  userRepository: Repository<User>;
  roomRepository: Repository<Room>;
  bookingRepository: Repository<Booking>;
  staffUser: User;
  adminUser: User;
  testRoom: Room;
  testUsers: Map<string, { id: string; email: string; first_name: string; last_name: string; role: UserRole }>;
}

export async function setupBookingsIntegrationTest(): Promise<BookingsTestContext> {
  const { AppModule } = await import('../../../src/app/app.module');
  const { AuthGuard } = await import('../../../src/shared/guards/auth.guard');
  const { RolesGuard } = await import('../../../src/shared/guards/roles.guard');

  // Map to hold test users for guard override
  const testUsers = new Map<string, { id: string; email: string; first_name: string; last_name: string; role: UserRole }>();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(AuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        // Check for test user ID header and set the appropriate user
        const testUserId = request.headers['x-test-user-id'];
        if (testUserId && testUsers.has(testUserId)) {
          request.user = testUsers.get(testUserId);
        }
        request.user ??= {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'test@uvic.ca',
          first_name: 'Test',
          last_name: 'User',
          role: UserRole.STAFF,
        };
        return true;
      }
    })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      const formattedErrors = errors.map(error => {
        const constraints = error.constraints;
        if (constraints) {
          return `${error.property}: ${Object.values(constraints).join(', ')}`;
        }
        return `${error.property}: validation failed`;
      });
      return new BadRequestException({
        message: formattedErrors,
        error: 'Validation Failed',
        statusCode: 400,
      });
    },
  }));

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();

  const userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  const roomRepository = moduleFixture.get<Repository<Room>>(getRepositoryToken(Room));
  const bookingRepository = moduleFixture.get<Repository<Booking>>(getRepositoryToken(Booking));

  // Create test users
  const emailSuffix = randomUUID();

  const staffUser = await userRepository.save({
    email: `staff-${emailSuffix}@uvic.ca`,
    password_hash: 'hash',
    first_name: 'Staff',
    last_name: 'User',
    role: UserRole.STAFF,
  });

  const adminUser = await userRepository.save({
    email: `admin-${emailSuffix}@uvic.ca`,
    password_hash: 'hash',
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
  });

  // Populate test users map for guard override
  testUsers.set(staffUser.id, {
    id: staffUser.id,
    email: staffUser.email,
    first_name: staffUser.first_name,
    last_name: staffUser.last_name,
    role: staffUser.role,
  });

  testUsers.set(adminUser.id, {
    id: adminUser.id,
    email: adminUser.email,
    first_name: adminUser.first_name,
    last_name: adminUser.last_name,
    role: adminUser.role,
  });

  // Create test room
  const testRoom = await roomRepository.findOne({ where: {} }) as Room;
  if (!testRoom) {
    throw new Error('No rooms found in test database');
  }

  return { app, userRepository, roomRepository, bookingRepository, staffUser, adminUser, testRoom, testUsers };
}
