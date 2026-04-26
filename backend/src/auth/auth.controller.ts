import { Controller, Get, Post, UseGuards, HttpCode, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request, Response } from 'express';
import { UserPayload } from './auth.service';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 24h
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = req.user as UserPayload;
    const isSuperAdmin = this.authService.isAdmin(user.username);
    const isGroupAdmin = isSuperAdmin || await this.authService.isGroupAdmin(user.id);
    return { ...user, isGroupAdmin };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  getUsers() {
    return this.authService.findAllUsers();
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { accessToken } = await this.authService.login(req.user as UserPayload);
    res.cookie('jwt', accessToken, COOKIE_OPTIONS);
    res.redirect(process.env.FRONTEND_URL || '/');
  }

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  discordLogin() {
    // Passport redirects to Discord
  }

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(@Req() req: Request, @Res() res: Response) {
    const { accessToken } = await this.authService.login(req.user as UserPayload);
    res.cookie('jwt', accessToken, COOKIE_OPTIONS);
    res.redirect(process.env.FRONTEND_URL || '/');
  }
}
