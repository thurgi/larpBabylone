import { Controller, Get, Post, UseGuards, HttpCode, Req, Inject } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';
import { AUTHORIZATION_SERVICE } from '@larpbabylone/nest-user-module';
import { AuthenticatedUser, AuthorizationService } from '@larpbabylone/user-module';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTHORIZATION_SERVICE)
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = (req as Request & { user: AuthenticatedUser }).user;
    const isSuperAdmin = this.authorizationService.isSuperAdmin(user);
    const isGroupAdmin = isSuperAdmin || this.authorizationService.hasAnyRole(user, ['group-admin', 'groups-admin']);
    return { ...user, provider: 'keycloak', isGroupAdmin };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  logout() {
    // Le frontend SPA pilote la deconnexion SSO Keycloak.
  }
}
