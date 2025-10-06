import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import bcrypt from 'bcryptjs';
import { UserRole } from '../database/entities/user.entity';
import { Session as ExpressSession } from 'express-session';

export interface AuthenticatedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface Session {
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(email: string, password: string): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };
  }

  async login(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async getSession(req: { session?: ExpressSession; user?: AuthenticatedUser }): Promise<Session | null> {
    if (req.user) {
      return { user: req.user };
    }
    return null;
  }
}