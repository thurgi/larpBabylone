import { AuthorizationContext } from '../types/authorization.types';
import { GroupMembership } from '../types/group.types';
export declare function isSuperAdmin(username: string, adminUsername?: string): boolean;
export declare function isGroupAdmin(userId: string, groups: GroupMembership[]): boolean;
export declare function hasPermission(context: AuthorizationContext): boolean;
