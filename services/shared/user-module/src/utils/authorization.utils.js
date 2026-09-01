export function isSuperAdmin(username, adminUsername) {
    return !!adminUsername && username === adminUsername;
}
export function isGroupAdmin(userId, groups) {
    return groups.some((group) => group.userIds.includes(userId) && group.permissions.admin);
}
export function hasPermission(context) {
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
        if (!group.userIds.includes(context.userId))
            return false;
        const resourcePerms = group.permissions[resource];
        if (!resourcePerms)
            return false;
        return !!resourcePerms[action];
    });
}
