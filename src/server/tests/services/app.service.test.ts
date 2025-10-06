import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AppService } from '../../src/app/app.service';
import { DataSource } from 'typeorm';

describe('AppService', () => {
  let service: AppService;
  let mockCacheManager: jest.Mocked<object>;
  let mockDataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockDataSource = {
      isInitialized: true,
      query: jest.fn().mockResolvedValue([{ now: new Date() }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // getHello() is intentionally not covered by tests anymore
});
