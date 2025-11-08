import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthenticatedUser } from './auth.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(
    user: AuthenticatedUser,
    done: (err: Error | null, payload?: AuthenticatedUser) => void,
  ): void {
    done(null, user);
  }

  deserializeUser(
    payload: AuthenticatedUser,
    done: (err: Error | null, user?: AuthenticatedUser | null) => void,
  ): void {
    done(null, payload ?? null);
  }
}
