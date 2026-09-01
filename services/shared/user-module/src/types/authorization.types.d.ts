import { GroupMembership } from './group.types';
export type Resource = 'documents' | 'versions' | 'groups';
export type Action = 'create' | 'read' | 'update' | 'delete';
export interface PermissionRequirement {
    resource: Resource;
    action: Action;
}
export interface AuthorizationContext {
    requirement: PermissionRequirement;
    groups: GroupMembership[];
    userId?: string;
    isSuperAdmin?: boolean;
}
