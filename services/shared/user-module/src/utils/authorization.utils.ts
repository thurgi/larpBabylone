import { AuthorizationContext } from '../types/authorization.types';
import { GroupMembership } from '../types/group.types';

export function isSuperAdmin(username: string, adminUsername?: string): boolean {
  return !!adminUsername && username === adminUsername;
}

export function isGroupAdmin(userId: string, groups: GroupMembership[]): boolean {
  return groups.some(
    (group) => group.userIds.includes(userId) && group.permissions.admin,
  );
}

export function hasPermission(context: AuthorizationContext): boolean {
  if (context.isSuperAdmin) {
    return true;
  }

  const { action, resource } = context.requirement;

  if (action === 'read' && context.groups.some((group) => group.permissions.publicRead)) {
    return true;
  }

  if (!context.userId) {
    return false;
  }

  return context.groups.some((group) => {
    if (!group.userIds.includes(context.userId!)) return false;
    const resourcePerms = group.permissions[resource];
    if (!resourcePerms) return false;
    return !!resourcePerms[action];
  });
}
