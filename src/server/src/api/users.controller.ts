import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto/user.dto';
import { AuthenticatedGuard } from '../shared/guards/authenticated.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthenticatedGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.REGISTRAR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto, requester);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.REGISTRAR)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all users',
    type: [UserResponseDto],
  })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Staff: own profile only, Registrar/Admin: any user)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Staff users can only view their own profile',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    // Permission check: Staff can only view their own profile
    if (requester.role === UserRole.STAFF && id !== requester.id) {
      throw new ForbiddenException('Staff users can only view their own profile');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User update not permitted',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: AuthenticatedUser,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, requester, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.REGISTRAR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Users may not delete themselves',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<void> {
    return this.usersService.remove(id, requester);
  }
}