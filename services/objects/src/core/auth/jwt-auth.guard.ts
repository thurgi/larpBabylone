import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTHENTICATION_SERVICE } from '@larpbabylone/nest-user-module';
import { AuthenticatedUser, AuthenticationService } from '@larpbabylone/user-module';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTHENTICATION_SERVICE)
    private readonly authenticationService: AuthenticationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers?: Record<string, unknown>; cookies?: Record<string, unknown>; user?: unknown }>();
    const token = this.authenticationService.extractToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    let user: AuthenticatedUser | null;
    try {
      user = await this.authenticationService.authenticate(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;
    return true;
  }
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTHENTICATION_SERVICE)
    private readonly authenticationService: AuthenticationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers?: Record<string, unknown>; cookies?: Record<string, unknown>; user?: unknown }>();
    const token = this.authenticationService.extractToken(request);
    if (!token) {
      request.user = null;
      return true;
    }

    let user: AuthenticatedUser | null = null;
    try {
      user = await this.authenticationService.authenticate(token);
    } catch {
      user = null;
    }
    request.user = user;
    return true;
  }
}
