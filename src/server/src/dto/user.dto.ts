import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../database/entities/user.entity';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const USER_ROLE_LOOKUP: Record<string, UserRole> = Object.values(UserRole).reduce(
  (acc, role) => {
    acc[role.toLowerCase()] = role;
    return acc;
  },
  {} as Record<string, UserRole>,
);

const normalizeUserRole = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  return USER_ROLE_LOOKUP[trimmed.toLowerCase()] ?? value;
};

const normalizeEmail = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase();
};

export class CreateUserDto {
  @ApiProperty({ example: 'user@uvic.ca', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => normalizeEmail(value))
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsNotEmpty()
  last_name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF, description: 'User role' })
  @IsEnum(UserRole)
  @Transform(({ value }) => normalizeUserRole(value))
  role!: UserRole;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'user@uvic.ca', description: 'User email address', required: false })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => normalizeEmail(value))
  email?: string;

  @ApiProperty({ example: 'newpassword123', description: 'New password (min 6 characters)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'John', description: 'User first name', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  first_name?: string;

  @ApiProperty({ example: 'Doe', description: 'User last name', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  last_name?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.REGISTRAR, description: 'User role', required: false })
  @IsOptional()
  @IsEnum(UserRole)
  @Transform(({ value }) => normalizeUserRole(value))
  role?: UserRole;
}

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'User unique identifier' })
  id!: string;

  @ApiProperty({ example: 'user@uvic.ca', description: 'User email address' })
  email!: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  first_name!: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  last_name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF, description: 'User role' })
  role!: UserRole;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Account creation date' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;
}
