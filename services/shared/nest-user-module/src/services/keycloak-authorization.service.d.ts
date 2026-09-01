import { AuthenticatedUser, AuthorizationService, PermissionRequirement } from "../../../user-module/src";
import { NestUserModuleOptions } from '../types/nest-user-module.types';
export declare class KeycloakAuthorizationService implements AuthorizationService {
    private readonly options;
    constructor(options: NestUserModuleOptions);
    isSuperAdmin(user: Pick<AuthenticatedUser, 'username' | 'roles'>): boolean;
    hasRole(user: Pick<AuthenticatedUser, 'roles'>, role: string): boolean;
    hasAnyRole(user: Pick<AuthenticatedUser, 'roles'>, roles: string[]): boolean;
    hasGroup(user: Pick<AuthenticatedUser, 'groups'>, group: string): boolean;
    canAccessRequirement(user: AuthenticatedUser | null, requirement: PermissionRequirement): boolean;
}
