export interface User {
  id: string;
  username: string;
  email?: string;
  provider: 'discord' | 'google';
  providerId?: string;
  isGroupAdmin?: boolean;
}

export interface Document {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  groupIds: string[];
  folderId: string | null;
}

export interface Version {
  id: string;
  documentId: string;
  title?: string;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

export interface VersionFull extends Version {
  content: string;
}

export interface CrudPermissions {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
}

export interface GroupPermissions {
  documents: CrudPermissions;
  versions: CrudPermissions;
  publicRead?: boolean;
  admin?: boolean;
}

export interface Group {
  id: string;
  name: string;
  permissions: GroupPermissions;
  userIds: string[];
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
