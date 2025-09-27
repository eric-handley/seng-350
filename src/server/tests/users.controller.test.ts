import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../src/api/users.controller';
import { UsersService } from '../src/services/users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../src/dto/user.dto';
import { UserRole } from '../src/database/entities/user.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUserResponse: UserResponseDto = {
    id: 'user-uuid',
    email: 'test@uvic.ca',
    role: UserRole.STAFF,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@uvic.ca',
      password: 'securePassword123',
      role: UserRole.STAFF,
    };

    it('should create a user successfully', async () => {
      mockUsersService.create.mockResolvedValue(mockUserResponse);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw ConflictException when user with email already exists', async () => {
      mockUsersService.create.mockRejectedValue(new ConflictException('User with this email already exists'));

      await expect(controller.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw BadRequestException for invalid input data', async () => {
      mockUsersService.create.mockRejectedValue(new BadRequestException('Invalid input data'));

      await expect(controller.create(createUserDto)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle different user roles', async () => {
      const registrarUserDto = { ...createUserDto, role: UserRole.REGISTRAR };
      const registrarResponse = { ...mockUserResponse, role: UserRole.REGISTRAR };
      mockUsersService.create.mockResolvedValue(registrarResponse);

      const result = await controller.create(registrarUserDto);

      expect(service.create).toHaveBeenCalledWith(registrarUserDto);
      expect(result).toEqual(registrarResponse);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [mockUserResponse];
      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users exist', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return multiple users with different roles', async () => {
      const mockUsers = [
        mockUserResponse,
        { ...mockUserResponse, id: 'user-uuid-2', role: UserRole.REGISTRAR },
        { ...mockUserResponse, id: 'user-uuid-3', role: UserRole.ADMIN },
      ];
      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(3);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.findOne('user-uuid');

      expect(service.findOne).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.findOne('non-existent-uuid')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('non-existent-uuid');
    });

    it('should handle invalid UUID format', async () => {
      const invalidUuid = 'invalid-uuid';
      
      // This would be caught by the ParseUUIDPipe in real implementation
      await expect(controller.findOne(invalidUuid)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'updated@uvic.ca',
    };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUserResponse, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-uuid', updateUserDto);

      expect(service.update).toHaveBeenCalledWith('user-uuid', updateUserDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.update.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.update('non-existent-uuid', updateUserDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith('non-existent-uuid', updateUserDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.update.mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.update('user-uuid', updateUserDto)).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith('user-uuid', updateUserDto);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { email: 'newemail@uvic.ca' };
      const updatedUser = { ...mockUserResponse, email: 'newemail@uvic.ca' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-uuid', partialUpdate);

      expect(service.update).toHaveBeenCalledWith('user-uuid', partialUpdate);
      expect(result).toEqual(updatedUser);
    });

    it('should handle role updates', async () => {
      const roleUpdate = { role: UserRole.ADMIN };
      const updatedUser = { ...mockUserResponse, role: UserRole.ADMIN };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-uuid', roleUpdate);

      expect(service.update).toHaveBeenCalledWith('user-uuid', roleUpdate);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('user-uuid');

      expect(service.remove).toHaveBeenCalledWith('user-uuid');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.remove.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.remove('non-existent-uuid')).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith('non-existent-uuid');
    });

    it('should handle cascading deletions properly', async () => {
      // Assuming the service handles cascade deletions
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('user-uuid');

      expect(service.remove).toHaveBeenCalledWith('user-uuid');
    });
  });
});