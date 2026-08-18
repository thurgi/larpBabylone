import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserPayload, isSuperAdmin } from '@larpbabylone/user-module';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(user: UserPayload): Promise<{ accessToken: string }> {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      provider: user.provider,
    };
    return { accessToken: this.jwtService.sign(payload) };
  }

  isSuperAdmin(username: string): boolean {
    return isSuperAdmin(username, process.env.ADMIN_USERNAME);
  }
}
