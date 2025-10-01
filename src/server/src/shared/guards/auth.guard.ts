import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if user exists in session or request
    const user = request.session?.user || request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Attach user to request for use in controllers
    request.user = user;
    return true;
  }
}