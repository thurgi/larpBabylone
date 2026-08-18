import { Controller, Get, Post, UseGuards, HttpCode, Req, Res } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { UserPayload } from '@larpbabylone/user-module';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = req.user as UserPayload;
    const isSuperAdmin = this.usersService.isAdmin(user.username);
    const isGroupAdmin = isSuperAdmin || (await this.usersService.isGroupAdmin(user.id));
    return { ...user, isGroupAdmin };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  getUsers() {
    return this.usersService.findAllUsers();
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    // Le cookie étant cross-domaine, la déconnexion complète se fait via le auth-service
    // Ici on efface juste le cookie local (au cas où)
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: process.env.COOKIE_DOMAIN || 'localhost',
    });
  }
}
