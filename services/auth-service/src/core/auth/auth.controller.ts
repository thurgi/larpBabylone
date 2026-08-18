import { Controller, Get, Post, UseGuards, HttpCode, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request, Response } from 'express';
import { UsersService } from '../../modules/users/users.service';
import { UserPayload } from '@larpbabylone/user-module';

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || 'localhost';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  domain: COOKIE_DOMAIN,
  maxAge: 24 * 60 * 60 * 1000, // 24h
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = req.user as UserPayload;
    return {
      ...user,
      isSuperAdmin: this.authService.isSuperAdmin(user.username),
    };
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
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: COOKIE_DOMAIN,
    });
  }

  @Get('logout-redirect')
  logoutRedirect(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: COOKIE_DOMAIN,
    });
    const returnTo = (req.query as any).returnTo as string;
    const target = returnTo && this.isSafeRedirect(returnTo)
      ? returnTo
      : process.env.DEFAULT_REDIRECT_URL || '/';
    res.redirect(target);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { accessToken } = await this.authService.login(req.user as UserPayload);
    res.cookie('jwt', accessToken, COOKIE_OPTIONS);
    res.redirect(this.getRedirectUrl(req));
  }

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  discordLogin() {}

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(@Req() req: Request, @Res() res: Response) {
    const { accessToken } = await this.authService.login(req.user as UserPayload);
    res.cookie('jwt', accessToken, COOKIE_OPTIONS);
    res.redirect(this.getRedirectUrl(req));
  }

  private getRedirectUrl(req: Request): string {
    // Retourner vers l'association d'origine si passée en query param
    const returnTo = (req.query as any).returnTo as string;
    if (returnTo && this.isSafeRedirect(returnTo)) return returnTo;
    return process.env.DEFAULT_REDIRECT_URL || '/';
  }

  private isSafeRedirect(url: string): boolean {
    try {
      const parsed = new URL(url);
      const allowedPattern = process.env.CORS_ORIGIN_PATTERN || '.*\\.localhost(:\\d+)?$';
      return new RegExp(allowedPattern).test(parsed.origin);
    } catch {
      return false;
    }
  }
}
