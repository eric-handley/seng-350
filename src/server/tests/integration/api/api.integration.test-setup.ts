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

// Increase timeout for DB container startup/sync
jest.setTimeout(30000);

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException, ExecutionContext } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response as ExpressResponse, NextFunction } from 'express';

import { User, UserRole } from '../../../src/database/entities/user.entity';
import { Building } from '../../../src/database/entities/building.entity';
import { Room } from '../../../src/database/entities/room.entity';
import { Booking } from '../../../src/database/entities/booking.entity';
import { BookingSeries } from '../../../src/database/entities/booking-series.entity';
import { AuditLog } from '../../../src/database/entities/audit-log.entity';
import { GlobalExceptionFilter } from '../../../src/filters/global-exception.filter';

export interface ApiTestContext {
  app: INestApplication;
  userRepository: Repository<User>;
  buildingRepository: Repository<Building>;
  roomRepository: Repository<Room>;
  bookingRepository: Repository<Booking>;
  bookingSeriesRepository: Repository<BookingSeries>;
  auditLogRepository: Repository<AuditLog>;
}

export async function setupTestApp(): Promise<ApiTestContext> {
  const { AppModule } = await import('../../../src/app/app.module');
  const { AuthGuard } = await import('../../../src/shared/guards/auth.guard');
  const { RolesGuard } = await import('../../../src/shared/guards/roles.guard');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(AuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        // Inject a default test user if not already set
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

  // Apply the same validation pipe configuration as in main.ts
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

  // Apply global exception filter for consistent error reporting
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Add middleware to inject test user into request
  app.use((req: Request, _res: ExpressResponse, next: NextFunction) => {
    req.user ??= {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'test@uvic.ca',
      first_name: 'Test',
      last_name: 'User',
      role: UserRole.STAFF,
    };
    next();
  });

  await app.init();

  return {
    app,
    userRepository: moduleFixture.get<Repository<User>>(getRepositoryToken(User)),
    buildingRepository: moduleFixture.get<Repository<Building>>(getRepositoryToken(Building)),
    roomRepository: moduleFixture.get<Repository<Room>>(getRepositoryToken(Room)),
    bookingRepository: moduleFixture.get<Repository<Booking>>(getRepositoryToken(Booking)),
    bookingSeriesRepository: moduleFixture.get<Repository<BookingSeries>>(getRepositoryToken(BookingSeries)),
    auditLogRepository: moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog)),
  };
}

export async function getTestData(buildingRepository: Repository<Building>, roomRepository: Repository<Room>) {
  const testBuilding = await buildingRepository.findOne({ where: {} });
  if (!testBuilding) {
    throw new Error('No buildings found in seed data');
  }

  const testRoom = await roomRepository.findOne({ where: { building_short_name: testBuilding.short_name } });
  if (!testRoom) {
    throw new Error('No rooms found in seed data');
  }

  return { testBuilding, testRoom };
}
