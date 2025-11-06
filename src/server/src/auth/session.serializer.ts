import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../services/users.service';
import { AuthenticatedUser } from './auth.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(
    user: AuthenticatedUser,
    done: (err: Error | null, id?: string) => void,
  ): void {
    done(null, user.id);
  }

  async deserializeUser(
    userId: string,
    done: (err: Error | null, user?: AuthenticatedUser | null) => void,
  ): Promise<void> {
    try {
      const user = await this.usersService.findOne(userId);
      done(null, {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      });
    } catch (error) {
      done(error as Error, null);
    }
  }
}
