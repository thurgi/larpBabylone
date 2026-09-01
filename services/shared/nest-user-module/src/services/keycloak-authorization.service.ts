import { Inject, Injectable } from '@nestjs/common';
import {
  AuthenticatedUser,
  AuthorizationService,
  PermissionRequirement,
} from '@larpbabylone/user-module';
import { NestUserModuleOptions, NEST_USER_MODULE_OPTIONS } from '../types/nest-user-module.types';

@Injectable()
export class KeycloakAuthorizationService implements AuthorizationService {
  constructor(
    @Inject(NEST_USER_MODULE_OPTIONS) private readonly options: NestUserModuleOptions,
  ) {}

  isSuperAdmin(user: Pick<AuthenticatedUser, 'username' | 'roles'>): boolean {
    if (this.options.adminUsername && user.username === this.options.adminUsername) {
      return true;
    }
    return this.hasAnyRole(user, ['super-admin', 'admin']);
  }

  hasRole(user: Pick<AuthenticatedUser, 'roles'>, role: string): boolean {
    return user.roles.includes(role);
  }

  hasAnyRole(user: Pick<AuthenticatedUser, 'roles'>, roles: string[]): boolean {
    return roles.some((role) => this.hasRole(user, role));
  }

  hasGroup(user: Pick<AuthenticatedUser, 'groups'>, group: string): boolean {
    return user.groups.includes(group);
  }

  canAccessRequirement(user: AuthenticatedUser | null, requirement: PermissionRequirement): boolean {
    if (!user) {
      return false;
    }

    if (this.isSuperAdmin(user)) {
      return true;
    }

    const requiredRole = `${requirement.resource}:${requirement.action}`;
    return this.hasRole(user, requiredRole);
  }
}
