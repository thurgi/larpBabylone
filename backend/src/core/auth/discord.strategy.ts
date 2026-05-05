import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { AuthService } from './auth.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.DISCORD_CLIENT_ID || 'not-configured',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || 'not-configured',
      callbackURL: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3001/auth/discord/callback',
      scope: ['identify', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; username: string; email?: string },
  ): Promise<any> {
    return this.authService.findOrCreateUser({
      provider: 'discord',
      providerId: profile.id,
      username: profile.username,
      email: profile.email,
    });
  }
}
