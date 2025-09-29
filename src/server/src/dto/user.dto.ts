import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../database/entities/user.entity';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@uvic.ca', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF, description: 'User role' })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'user@uvic.ca', description: 'User email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'newpassword123', description: 'New password (min 6 characters)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.REGISTRAR, description: 'User role', required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'User unique identifier' })
  id!: string;

  @ApiProperty({ example: 'user@uvic.ca', description: 'User email address' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF, description: 'User role' })
  role!: UserRole;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Account creation date' })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updated_at!: Date;
}