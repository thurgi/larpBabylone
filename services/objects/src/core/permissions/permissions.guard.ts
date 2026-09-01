import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Inject,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuthenticatedUser,
  AuthorizationService,
  PermissionRequirement,
  hasPermission,
} from '@larpbabylone/user-module';
import { AUTHORIZATION_SERVICE } from '@larpbabylone/nest-user-module';
import { GroupEntity } from '../groups/entities/group.entity';
import { DocumentEntity } from '../../modules/documents/entities/document.entity';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (resource: PermissionRequirement['resource'], action: PermissionRequirement['action']) =>
  SetMetadata(PERMISSION_KEY, { resource, action });

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTHORIZATION_SERVICE)
    private readonly authorizationService: AuthorizationService,
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
    const user: AuthenticatedUser | null = request.user;

    // For non-read actions, user must be authenticated
    if (!user && requirement.action !== 'read') {
      throw new UnauthorizedException();
    }

    // Superadmin bypasses all checks
    if (user && this.authorizationService.isSuperAdmin(user)) {
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

    const allowed = hasPermission({
      requirement,
      groups,
      userId: user?.id,
      isSuperAdmin: false,
    });
    if (allowed) return true;

    if (!user) {
      throw new UnauthorizedException();
    }
    throw new ForbiddenException('Droits insuffisants');
  }
}
