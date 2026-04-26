import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StorageService } from '../storage/storage.service';
import { AuthService, UserPayload } from '../auth/auth.service';

export const PERMISSION_KEY = 'permission';

export interface PermissionRequirement {
  resource: 'documents' | 'versions';
  action: 'create' | 'read' | 'update' | 'delete';
}

import { SetMetadata } from '@nestjs/common';
export const RequirePermission = (resource: PermissionRequirement['resource'], action: PermissionRequirement['action']) =>
  SetMetadata(PERMISSION_KEY, { resource, action });

interface GroupData {
  id: string;
  name: string;
  permissions: {
    documents: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
    versions: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
    publicRead?: boolean;
    admin?: boolean;
  };
  userIds: string[];
}

interface DocumentMetadata {
  id: string;
  title: string;
  groupIds: string[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly storageService: StorageService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserPayload = request.user;

    if (!user) {
      throw new ForbiddenException();
    }

    if (this.authService.isAdmin(user.username)) {
      return true;
    }

    const documentId = request.params.documentId;
    if (!documentId) {
      return true;
    }

    const docMeta = await this.storageService.readJson<DocumentMetadata>(
      this.storageService.resolvePath('documents', documentId, 'metadata.json'),
    );

    if (!docMeta) {
      return true;
    }

    if (!docMeta.groupIds || docMeta.groupIds.length === 0) {
      return true;
    }

    for (const groupId of docMeta.groupIds) {
      const group = await this.storageService.readJson<GroupData>(
        this.storageService.resolvePath('groups', `${groupId}.json`),
      );

      if (!group) continue;

      if (!group.userIds.includes(user.id)) continue;

      const resourcePerms = group.permissions[requirement.resource];
      if (resourcePerms && resourcePerms[requirement.action]) {
        return true;
      }
    }

    throw new ForbiddenException('Droits insuffisants');
  }
}
