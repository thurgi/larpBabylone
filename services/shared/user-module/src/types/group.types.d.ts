export interface PermissionMatrix {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
}
export interface GroupPermissions {
    admin?: boolean;
    publicRead?: boolean;
    documents: PermissionMatrix;
    versions: PermissionMatrix;
    groups?: PermissionMatrix;
}
export interface GroupMembership {
    id: string;
    userIds: string[];
    permissions: GroupPermissions;
}
