import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.DISCORD_CLIENT_ID || 'not-configured',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || 'not-configured',
      callbackURL: process.env.DISCORD_CALLBACK_URL || 'http://auth.localhost:3000/api/auth/discord/callback',
      scope: ['identify', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; username: string; email?: string },
  ): Promise<any> {
    return this.usersService.findOrCreateUser({
      provider: 'discord',
      providerId: profile.id,
      username: profile.username,
      email: profile.email,
    });
  }
}
