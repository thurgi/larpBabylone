import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTHENTICATION_SERVICE } from '../types/nest-user-module.types';
import { AuthenticationService } from '@larpbabylone/user-module';

@Injectable()
export class KeycloakJwtAuthGuard implements CanActivate {
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

    const user = await this.authenticationService.authenticate(token);
    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;
    return true;
  }
}

@Injectable()
export class OptionalKeycloakJwtAuthGuard implements CanActivate {
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

    const user = await this.authenticationService.authenticate(token);
    request.user = user;
    return true;
  }
}
