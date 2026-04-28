import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService, UserPayload } from '../auth/auth.service';
import { GroupEntity } from '../groups/entities/group.entity';
import { DocumentEntity } from '../../modules/documents/entities/document.entity';

export const PERMISSION_KEY = 'permission';

export interface PermissionRequirement {
  resource: 'documents' | 'versions' | 'groups';
  action: 'create' | 'read' | 'update' | 'delete';
}

import { SetMetadata } from '@nestjs/common';
export const RequirePermission = (resource: PermissionRequirement['resource'], action: PermissionRequirement['action']) =>
  SetMetadata(PERMISSION_KEY, { resource, action });

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepository: Repository<GroupEntity>,
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
    const user: UserPayload | null = request.user;

    // For non-read actions, user must be authenticated
    if (!user && requirement.action !== 'read') {
      throw new UnauthorizedException();
    }

    // Superadmin bypasses all checks
    if (user && this.authService.isAdmin(user.username)) {
      return true;
    }

    const documentId = request.params.documentId;
    if (!documentId) {
      // No document context (e.g. list or create) — require auth
      if (!user) {
        throw new UnauthorizedException();
      }
      return true;
    }

    const docMeta = await this.documentsRepository.findOneBy({ id: documentId });

    if (!docMeta) {
      return true;
    }

    const docGroupIds = docMeta.groupIds;

    // No groups assigned → open access (but must be authenticated)
    if (!docGroupIds || docGroupIds.length === 0) {
      if (!user) {
        throw new UnauthorizedException();
      }
      return true;
    }

    // Load all groups for this document
    const groups: GroupEntity[] = [];
    for (const groupId of docGroupIds) {
      const group = await this.groupsRepository.findOneBy({ id: groupId });
      if (group) groups.push(group);
    }

    // Check publicRead: if any group has publicRead and action is read, allow
    if (requirement.action === 'read') {
      const hasPublicRead = groups.some(g => g.permissions.publicRead);
      if (hasPublicRead) {
        return true;
      }
    }

    // From here, user must be authenticated
    if (!user) {
      throw new UnauthorizedException();
    }

    // Check user's group permissions
    for (const group of groups) {
      if (!group.userIds.includes(user.id)) continue;

      const resourcePerms = group.permissions[requirement.resource];
      if (resourcePerms && (resourcePerms as any)[requirement.action]) {
        return true;
      }
    }

    throw new ForbiddenException('Droits insuffisants');
  }
}
