import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'not-configured',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-configured',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; displayName: string; emails?: { value: string }[] },
    done: VerifyCallback,
  ): Promise<void> {
    const user = await this.usersService.findOrCreateLocalUser({
      id: profile.id,
      username: profile.displayName,
      email: profile.emails?.[0]?.value,
      provider: 'google',
    });
    if (!user) {
      done(new Error('Unable to synchronize user'));
      return;
    }
    done(null, user);
  }
}
