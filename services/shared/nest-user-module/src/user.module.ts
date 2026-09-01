import { DynamicModule, Module } from '@nestjs/common';
import { AUTHENTICATION_SERVICE, AUTHORIZATION_SERVICE, NEST_USER_MODULE_OPTIONS, NestUserModuleOptions } from './types/nest-user-module.types';
import { KeycloakAuthenticationService } from './services/keycloak-authentication.service';
import { KeycloakAuthorizationService } from './services/keycloak-authorization.service';
import { KeycloakJwtAuthGuard, OptionalKeycloakJwtAuthGuard } from './guards/keycloak-jwt-auth.guard';

@Module({})
export class NestUserModule {
  static register(options: NestUserModuleOptions): DynamicModule {
    return {
      module: NestUserModule,
      providers: [
        { provide: NEST_USER_MODULE_OPTIONS, useValue: options },
        KeycloakAuthenticationService,
        KeycloakAuthorizationService,
        { provide: AUTHENTICATION_SERVICE, useExisting: KeycloakAuthenticationService },
        { provide: AUTHORIZATION_SERVICE, useExisting: KeycloakAuthorizationService },
        KeycloakJwtAuthGuard,
        OptionalKeycloakJwtAuthGuard,
      ],
      exports: [
        AUTHENTICATION_SERVICE,
        AUTHORIZATION_SERVICE,
        KeycloakJwtAuthGuard,
        OptionalKeycloakJwtAuthGuard,
      ],
    };
  }
}
