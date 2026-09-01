import { Injectable } from '@angular/core';
import { AuthenticatedUser, AuthorizationService, PermissionRequirement } from '@larpbabylone/user-module';

@Injectable()
export class AngularAuthorizationService implements AuthorizationService {
  isSuperAdmin(user: Pick<AuthenticatedUser, 'username' | 'roles'>): boolean {
    return user.roles.includes('super-admin') || user.roles.includes('admin');
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

    return this.hasRole(user, `${requirement.resource}:${requirement.action}`);
  }
}
