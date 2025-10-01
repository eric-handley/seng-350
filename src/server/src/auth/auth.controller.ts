import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Request, Response } from 'express';
import { AuthService, AuthenticatedUser } from './auth.service';

class LoginDto {
  @ApiProperty({ example: 'user@uvic.ca' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    @Req() req: Request,
  ): Promise<AuthenticatedUser> {
    const user = await this.authService.login(loginDto.email, loginDto.password);

    // Store user in session
    if (req.session) {
      (req.session as any).user = user;
    }

    // Also attach to request for immediate use
    (req as any).user = user;

    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and destroy session' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Logout successful',
  })
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
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
  async getSession(@Req() req: Request): Promise<{ user: AuthenticatedUser }> {
    const user = (req.session as any)?.user || (req as any).user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return { user };
  }
}