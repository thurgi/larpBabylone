import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.jwt || null,
      ignoreExpiration: false,
      // Même secret que le auth-service → valide les JWT émis centralement
      secretOrKey: process.env.JWT_SECRET || 'test-secret',
    });
  }

  async validate(payload: { sub: string; username: string; email?: string; provider?: string }) {
    // Auto-enregistre l'utilisateur localement à sa première visite sur cette instance
    const user = await this.usersService.findOrCreateLocalUser({
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      provider: payload.provider as 'discord' | 'google',
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
