import { PermissionRequirement } from './authorization.types';
export interface AuthenticationCheckOptions {
    requireActive?: boolean;
}
export interface AuthenticatedUser {
    id: string;
    username: string;
    email?: string;
    roles: string[];
    groups: string[];
    claims: Record<string, unknown>;
}
export interface AuthenticationService {
    extractToken(input: {
        headers?: Record<string, unknown>;
        cookies?: Record<string, unknown>;
    }): string | null;
    authenticate(token: string, options?: AuthenticationCheckOptions): Promise<AuthenticatedUser | null>;
}
export interface AuthorizationService {
    isSuperAdmin(user: Pick<AuthenticatedUser, 'username' | 'roles'>): boolean;
    hasRole(user: Pick<AuthenticatedUser, 'roles'>, role: string): boolean;
    hasAnyRole(user: Pick<AuthenticatedUser, 'roles'>, roles: string[]): boolean;
    hasGroup(user: Pick<AuthenticatedUser, 'groups'>, group: string): boolean;
    canAccessRequirement(user: AuthenticatedUser | null, requirement: PermissionRequirement): boolean;
}
