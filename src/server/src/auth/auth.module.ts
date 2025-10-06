import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../services/users.service';
import { User } from '../database/entities/user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AuditLogsService } from '../services/audit-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuditLog])],
  controllers: [AuthController],
  providers: [AuthService, UsersService, AuditLogsService],
  exports: [AuthService],
})
export class AuthModule {}