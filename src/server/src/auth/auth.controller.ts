import { Controller, All, Req, Res, Next } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  // Auth controller for handling authentication routes
  constructor(private readonly authService: AuthService) {}

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    const authHandler = this.authService.getAuthHandler();
    return authHandler(req, res, next);
  }
}