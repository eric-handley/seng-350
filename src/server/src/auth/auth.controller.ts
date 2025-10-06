import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Request, Response } from 'express';
import { AuthService, AuthenticatedUser } from './auth.service';
import { Session } from 'express-session';
import { AuditLogsService } from '../services/audit-logs.service';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
  session: Session & Partial<{ user?: AuthenticatedUser }>;
}

class LoginDto {
  @ApiProperty({ example: 'admin@uvic.ca' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: RequestWithUser,
  ): Promise<AuthenticatedUser> {
    const user = await this.authService.login(loginDto.email, loginDto.password);

    // Store user in session
    if (req.session) {
      req.session.user = user;
    }

    // Also attach to request for immediate use
    req.user = user;

    // Log the login event
    await this.auditLogsService.createAuditLog(
      user.id,
      'LOGIN',
      '/auth',
      null,
      { email: loginDto.email },
    );

    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and destroy session' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Logout successful',
  })
  async logout(@Req() req: RequestWithUser, @Res() res: Response): Promise<void> {
    const user = req.session?.user ?? req.user;

    return new Promise((resolve, reject) => {
      // Log the logout event before destroying session
      const logoutPromise = user
        ? this.auditLogsService.createAuditLog(
            user.id,
            'LOGOUT',
            '/auth',
            null,
            null,
          )
        : Promise.resolve();

      logoutPromise
        .catch(err => {
          console.error('Failed to log logout event:', err);
        })
        .finally(() => {
          if (req.session) {
            req.session.destroy((err) => {
              if (err) {
                reject(err);
              } else {
                res.clearCookie('connect.sid');
                res.status(HttpStatus.NO_CONTENT).send();
                resolve();
              }
            });
          } else {
            res.status(HttpStatus.NO_CONTENT).send();
            resolve();
          }
        });
    });
  }

  @Get('session')
  @ApiOperation({ summary: 'Get current session information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current session',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async getSession(@Req() req: RequestWithUser): Promise<{ user: AuthenticatedUser }> {
    const user = req.session?.user ?? req.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return { user };
  }
}