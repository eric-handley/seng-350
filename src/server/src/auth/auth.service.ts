import { Injectable } from '@nestjs/common';
import { ExpressAuth } from '@auth/express';

@Injectable()
export class AuthService {
  private authHandler;

  constructor() {
    this.authHandler = ExpressAuth({
      providers: [
        // TODO: Add providers (Google, GitHub, etc.) when needed
      ],
      secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key',
      trustHost: true,
    });
  }

  getAuthHandler() {
    return this.authHandler;
  }

  async getSession(req: any) {
    // Extract session from request if available
    return req.auth || null;
  }
}