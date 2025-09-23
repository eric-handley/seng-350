import { Injectable } from '@nestjs/common';
import { ExpressAuth } from '@auth/express';

export interface Session {
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
}

@Injectable()
export class AuthService {
  private authHandler;

  constructor() {
    this.authHandler = ExpressAuth({
      providers: [
        // TODO: Add providers (Google, GitHub, etc.) when needed
      ],
      secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret-key',
      trustHost: true,
    });
  }

  getAuthHandler() {
    return this.authHandler;
  }

  async getSession(req: { auth?: Session }) {
    // Extract session from request if available
    return req.auth ?? null;
  }
}