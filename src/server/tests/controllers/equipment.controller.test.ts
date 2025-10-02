import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from '../../src/api/equipment.controller';
import { EquipmentService } from '../../src/services/equipment.service';
import { EquipmentResponseDto } from '../../src/dto/equipment.dto';
import { NotFoundException } from '@nestjs/common';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: EquipmentService;

  const mockEquipmentResponse: EquipmentResponseDto = {
    id: 'equipment-uuid',
    name: 'Projector',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockEquipmentService = {
    findEquipmentByRoom: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        {
          provide: EquipmentService,
          useValue: mockEquipmentService,
        },
      ],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
    service = module.get<EquipmentService>(EquipmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findEquipmentByRoom', () => {
    it('should return equipment for a specific room', async () => {
      const mockEquipment = [mockEquipmentResponse];
      mockEquipmentService.findEquipmentByRoom.mockResolvedValue(mockEquipment);

      const result = await controller.findEquipmentByRoom('room-uuid');

      expect(service.findEquipmentByRoom).toHaveBeenCalledWith('room-uuid');
      expect(result).toEqual(mockEquipment);
    });

    it('should return multiple equipment items for a room', async () => {
      const mockEquipment = [
        mockEquipmentResponse,
        {
          ...mockEquipmentResponse,
          id: 'equipment-uuid-2',
          name: 'Whiteboard',
        },
        {
          ...mockEquipmentResponse,
          id: 'equipment-uuid-3',
          name: 'Audio System',
        },
      ];
      mockEquipmentService.findEquipmentByRoom.mockResolvedValue(mockEquipment);

      const result = await controller.findEquipmentByRoom('room-uuid');

      expect(service.findEquipmentByRoom).toHaveBeenCalledWith('room-uuid');
      expect(result).toEqual(mockEquipment);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when room has no equipment', async () => {
      mockEquipmentService.findEquipmentByRoom.mockResolvedValue([]);

      const result = await controller.findEquipmentByRoom('room-uuid');

      expect(service.findEquipmentByRoom).toHaveBeenCalledWith('room-uuid');
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when room not found', async () => {
      mockEquipmentService.findEquipmentByRoom.mockRejectedValue(
        new NotFoundException('Room not found or no equipment in room')
      );

      await expect(controller.findEquipmentByRoom('non-existent-room-uuid')).rejects.toThrow(NotFoundException);
      expect(service.findEquipmentByRoom).toHaveBeenCalledWith('non-existent-room-uuid');
    });

    it('should handle rooms with multiple equipment items', async () => {
      const commonEquipment = [
        {
          ...mockEquipmentResponse,
          id: 'equipment-uuid-1',
          name: 'Projector',
        },
        {
          ...mockEquipmentResponse,
          id: 'equipment-uuid-2',
          name: 'Computer',
        },
        {
          ...mockEquipmentResponse,
          id: 'equipment-uuid-3',
          name: 'Microphone',
        },
      ];
      mockEquipmentService.findEquipmentByRoom.mockResolvedValue(commonEquipment);

      const result = await controller.findEquipmentByRoom('classroom-uuid');

      expect(service.findEquipmentByRoom).toHaveBeenCalledWith('classroom-uuid');
      expect(result).toEqual(commonEquipment);
      expect(result.every(eq => eq.name)).toBeTruthy();
    });
  });
});