import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from '../src/api/rooms.controller';
import { RoomsService } from '../src/services/rooms.service';
import { RoomQueryDto, RoomResponseDto } from '../src/dto/room.dto';
import { RoomType } from '../src/database/entities/room.entity';
import { NotFoundException } from '@nestjs/common';

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: RoomsService;

  const mockRoomResponse: RoomResponseDto = {
    id: 'room-uuid',
    room: '101',
    building_id: 'building-uuid',
    capacity: 30,
    room_type: RoomType.CLASSROOM,
    url: 'https://example.com/room/101',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockRoomsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: mockRoomsService,
        },
      ],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
    service = module.get<RoomsService>(RoomsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all rooms without filters', async () => {
      const mockRooms = [mockRoomResponse];
      mockRoomsService.findAll.mockResolvedValue(mockRooms);
      const queryDto: RoomQueryDto = {};

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockRooms);
    });

    it('should return rooms with building_id filter', async () => {
      const mockRooms = [mockRoomResponse];
      mockRoomsService.findAll.mockResolvedValue(mockRooms);
      const queryDto: RoomQueryDto = { building_id: 'building-uuid' };

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockRooms);
    });

    it('should return rooms with min_capacity filter', async () => {
      const mockRooms = [mockRoomResponse];
      mockRoomsService.findAll.mockResolvedValue(mockRooms);
      const queryDto: RoomQueryDto = { min_capacity: 20 };

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockRooms);
    });

    it('should return rooms with room_type filter', async () => {
      const mockRooms = [mockRoomResponse];
      mockRoomsService.findAll.mockResolvedValue(mockRooms);
      const queryDto: RoomQueryDto = { room_type: RoomType.CLASSROOM };

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockRooms);
    });

    it('should return rooms with equipment filter', async () => {
      const mockRooms = [mockRoomResponse];
      mockRoomsService.findAll.mockResolvedValue(mockRooms);
      const queryDto: RoomQueryDto = { equipment: 'projector' };

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockRooms);
    });

    it('should return rooms with all filters', async () => {
      const mockRooms = [mockRoomResponse];
      mockRoomsService.findAll.mockResolvedValue(mockRooms);
      const queryDto: RoomQueryDto = {
        building_id: 'building-uuid',
        min_capacity: 20,
        room_type: RoomType.CLASSROOM,
        equipment: 'projector',
      };

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockRooms);
    });

    it('should return empty array when no rooms match filters', async () => {
      mockRoomsService.findAll.mockResolvedValue([]);
      const queryDto: RoomQueryDto = { min_capacity: 1000 };

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a room by id', async () => {
      mockRoomsService.findOne.mockResolvedValue(mockRoomResponse);

      const result = await controller.findOne('room-uuid');

      expect(service.findOne).toHaveBeenCalledWith('room-uuid');
      expect(result).toEqual(mockRoomResponse);
    });

    it('should throw NotFoundException when room not found', async () => {
      mockRoomsService.findOne.mockRejectedValue(new NotFoundException('Room not found'));

      await expect(controller.findOne('non-existent-uuid')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('non-existent-uuid');
    });
  });
});