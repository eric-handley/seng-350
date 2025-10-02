import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity';
import { AuthenticatedUser } from '../auth/auth.service'
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto/user.dto';
import bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, requester: AuthenticatedUser): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Permission check: Registrar can only create Staff users, Admin can create any role
    const targetRole = createUserDto.role;
    if (requester.role === UserRole.REGISTRAR && targetRole !== UserRole.STAFF) {
      throw new ForbiddenException('Registrars can only create Staff users');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password_hash: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    return this.toResponseDto(savedUser);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();
    return users.map(user => this.toResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, requester: AuthenticatedUser, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Permission check: Registrar can only edit Staff users (excluding role)
    // Exception: Users can always update their own profile (except role field)
    if (requester.role === UserRole.REGISTRAR && user.id !== requester.id) {
      if (user.role !== UserRole.STAFF) {
        throw new ForbiddenException('Registrars can only edit Staff users');
      }
      if (updateUserDto.role && updateUserDto.role !== user.role) {
        throw new ForbiddenException('Registrars cannot change user roles');
      }
    }

    // Permission check: Only Admin can edit roles
    if (updateUserDto.role && updateUserDto.role !== user.role) {
      if (requester.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only Admins can change user roles');
      }
      if (user.id === requester.id) {
        throw new ForbiddenException('Users may not change their own role');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (updateUserDto.password) {
      const hashed = await bcrypt.hash(updateUserDto.password, 10);
      user.password_hash = hashed;
      delete updateUserDto.password;
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.userRepository.save(user);
    return this.toResponseDto(savedUser);
  }

  async remove(id: string, requester: AuthenticatedUser): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === requester.id) {
      throw new ForbiddenException('Users may not delete themselves');
    }

    // Permission check: Registrar can only delete Staff users
    if (requester.role === UserRole.REGISTRAR && user.role !== UserRole.STAFF) {
      throw new ForbiddenException('Registrars can only delete Staff users');
    }

    await this.userRepository.remove(user);
  }

  private toResponseDto(user: User): UserResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userResponse } = user;
    return userResponse;
  }
}
