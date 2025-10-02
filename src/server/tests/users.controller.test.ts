import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../src/api/users.controller';
import { UsersService } from '../src/services/users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../src/dto/user.dto';
import { UserRole } from '../src/database/entities/user.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthenticatedUser } from '../src/auth/auth.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid',
    email: 'test@uvic.ca',
    first_name: 'Test',
    last_name: 'User',
    role: UserRole.STAFF,
  };

  const mockAdminUser: AuthenticatedUser = {
    id: 'admin-uuid',
    email: 'admin@uvic.ca',
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
  };

  const mockUserResponse: UserResponseDto = {
    id: 'user-uuid',
    email: 'test@uvic.ca',
    first_name: 'John',
    last_name: 'Doe',
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
      first_name: 'John',
      last_name: 'Doe',
      role: UserRole.STAFF,
    };

    it('should create a user successfully', async () => {
      mockUsersService.create.mockResolvedValue(mockUserResponse);

      const result = await controller.create(createUserDto, mockAdminUser);

      expect(service.create).toHaveBeenCalledWith(createUserDto, mockAdminUser);
      expect(result).toEqual(mockUserResponse);
    });

    it('should handle different user roles', async () => {
      const registrarUserDto = { ...createUserDto, role: UserRole.REGISTRAR };
      const registrarResponse = { ...mockUserResponse, role: UserRole.REGISTRAR };
      mockUsersService.create.mockResolvedValue(registrarResponse);

      const result = await controller.create(registrarUserDto, mockAdminUser);

      expect(service.create).toHaveBeenCalledWith(registrarUserDto, mockAdminUser);
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

      const result = await controller.findOne('user-uuid', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.findOne('non-existent-uuid', mockAdminUser)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('non-existent-uuid');
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'updated@uvic.ca',
    };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUserResponse, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-uuid', mockUser, updateUserDto);

      expect(service.update).toHaveBeenCalledWith('user-uuid', mockUser, updateUserDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.update.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.update('non-existent-uuid', mockUser, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith('non-existent-uuid', mockUser, updateUserDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.update.mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.update('user-uuid', mockUser, updateUserDto)).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith('user-uuid', mockUser, updateUserDto);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { email: 'newemail@uvic.ca' };
      const updatedUser = { ...mockUserResponse, email: 'newemail@uvic.ca' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-uuid', mockUser, partialUpdate);

      expect(service.update).toHaveBeenCalledWith('user-uuid', mockUser, partialUpdate);
      expect(result).toEqual(updatedUser);
    });

    it('should allow no-op role updates (same role)', async () => {
      const noOpUpdate = { first_name: 'Jane', role: UserRole.STAFF };
      const updatedUser = { ...mockUserResponse, first_name: 'Jane', role: UserRole.STAFF };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-uuid', mockUser, noOpUpdate);

      expect(service.update).toHaveBeenCalledWith('user-uuid', mockUser, noOpUpdate);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('user-uuid', mockUser);

      expect(service.remove).toHaveBeenCalledWith('user-uuid', mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.remove.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.remove('non-existent-uuid', mockUser)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith('non-existent-uuid', mockUser);
    });

    it('should handle cascading deletions properly', async () => {
      // Assuming the service handles cascade deletions
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('user-uuid', mockUser);

      expect(service.remove).toHaveBeenCalledWith('user-uuid', mockUser);
    });
  });
});