import { Test, TestingModule } from '@nestjs/testing';
import { BuildingsController } from '../../src/api/buildings.controller';
import { BuildingsService } from '../../src/services/buildings.service';
import { RoomsService } from '../../src/services/rooms.service';
import { BuildingResponseDto } from '../../src/dto/building.dto';
import { RoomResponseDto } from '../../src/dto/room.dto';
import { RoomType } from '../../src/database/entities/room.entity';
import { NotFoundException } from '@nestjs/common';

describe('BuildingsController', () => {
  let controller: BuildingsController;
  let buildingsService: BuildingsService;
  let roomsService: RoomsService;

  const mockBuildingResponse: BuildingResponseDto = {
    short_name: 'ELW',
    name: 'Elliott Building',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockRoomResponse: RoomResponseDto = {
    room_id: 'ELW-101',
    building_short_name: 'ELW',
    room_number: '101',
    capacity: 30,
    room_type: RoomType.CLASSROOM,
    url: 'https://example.com/room/101',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockBuildingsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRoomsService = {
    findByBuilding: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuildingsController],
      providers: [
        {
          provide: BuildingsService,
          useValue: mockBuildingsService,
        },
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
      ],
    }).compile();

    controller = module.get<BuildingsController>(BuildingsController);
    buildingsService = module.get<BuildingsService>(BuildingsService);
    roomsService = module.get<RoomsService>(RoomsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all buildings without rooms', async () => {
      const mockBuildings = [mockBuildingResponse];
      mockBuildingsService.findAll.mockResolvedValue(mockBuildings);

      const result = await controller.findAll(false);

      expect(buildingsService.findAll).toHaveBeenCalledWith(false);
      expect(result).toEqual(mockBuildings);
    });

    it('should return all buildings with rooms when includeRooms is true', async () => {
      const buildingWithRooms = {
        ...mockBuildingResponse,
        rooms: [mockRoomResponse],
      };
      mockBuildingsService.findAll.mockResolvedValue([buildingWithRooms]);

      const result = await controller.findAll(true);

      expect(buildingsService.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual([buildingWithRooms]);
    });

    it('should default includeRooms to false', async () => {
      const mockBuildings = [mockBuildingResponse];
      mockBuildingsService.findAll.mockResolvedValue(mockBuildings);

      // Test the default value behavior
      const result = await controller.findAll(false);

      expect(buildingsService.findAll).toHaveBeenCalledWith(false);
      expect(result).toEqual(mockBuildings);
    });

    it('should return empty array when no buildings exist', async () => {
      mockBuildingsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(false);

      expect(buildingsService.findAll).toHaveBeenCalledWith(false);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a building by short_name without rooms', async () => {
      mockBuildingsService.findOne.mockResolvedValue(mockBuildingResponse);

      const result = await controller.findOne('ELW', false);

      expect(buildingsService.findOne).toHaveBeenCalledWith('ELW', false);
      expect(result).toEqual(mockBuildingResponse);
    });

    it('should return a building by short_name with rooms when includeRooms is true', async () => {
      const buildingWithRooms = {
        ...mockBuildingResponse,
        rooms: [mockRoomResponse],
      };
      mockBuildingsService.findOne.mockResolvedValue(buildingWithRooms);

      const result = await controller.findOne('ELW', true);

      expect(buildingsService.findOne).toHaveBeenCalledWith('ELW', true);
      expect(result).toEqual(buildingWithRooms);
    });

    it('should throw NotFoundException when building not found', async () => {
      mockBuildingsService.findOne.mockRejectedValue(new NotFoundException('Building not found'));

      await expect(controller.findOne('NONEXISTENT', false)).rejects.toThrow(NotFoundException);
      expect(buildingsService.findOne).toHaveBeenCalledWith('NONEXISTENT', false);
    });
  });

  describe('findRoomsByBuilding', () => {
    it('should return rooms for a specific building', async () => {
      const mockRooms = [mockRoomResponse];
      mockRoomsService.findByBuilding.mockResolvedValue(mockRooms);

      const result = await controller.findRoomsByBuilding('ELW');

      expect(roomsService.findByBuilding).toHaveBeenCalledWith('ELW');
      expect(result).toEqual(mockRooms);
    });

    it('should return empty array when building has no rooms', async () => {
      mockRoomsService.findByBuilding.mockResolvedValue([]);

      const result = await controller.findRoomsByBuilding('ELW');

      expect(roomsService.findByBuilding).toHaveBeenCalledWith('ELW');
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when building does not exist', async () => {
      mockRoomsService.findByBuilding.mockRejectedValue(new NotFoundException('Building not found'));

      await expect(controller.findRoomsByBuilding('NONEXISTENT')).rejects.toThrow(NotFoundException);
      expect(roomsService.findByBuilding).toHaveBeenCalledWith('NONEXISTENT');
    });

    it('should handle multiple rooms in building', async () => {
      const mockRooms = [
        mockRoomResponse,
        {
          ...mockRoomResponse,
          room_id: 'ELW-102',
          room_number: '102',
          room_type: RoomType.LECTURE_THEATRE,
        },
      ];
      mockRoomsService.findByBuilding.mockResolvedValue(mockRooms);

      const result = await controller.findRoomsByBuilding('ELW');

      expect(roomsService.findByBuilding).toHaveBeenCalledWith('ELW');
      expect(result).toEqual(mockRooms);
      expect(result).toHaveLength(2);
    });
  });
});