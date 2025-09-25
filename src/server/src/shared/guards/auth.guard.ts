import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService, Session } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session: Session | null = await this.authService.getSession(request);
    
    if (!session?.user) {
      return false;
    }

    // Attach user to request for use in controllers
    request.user = session.user;
    return true;
  }
}