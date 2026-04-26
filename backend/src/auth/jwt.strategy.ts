import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.jwt || null,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'test-secret',
    });
  }

  async validate(payload: { sub: string; username: string }) {
    const user = await this.authService.getProfile(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
