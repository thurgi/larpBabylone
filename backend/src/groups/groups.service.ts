import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { v4 as uuidv4 } from 'uuid';

export interface GroupEntity {
  id: string;
  name: string;
  permissions: {
    documents: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
    versions: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
    groups?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
    publicRead?: boolean;
    admin?: boolean;
  };
  userIds: string[];
}

@Injectable()
export class GroupsService {
  constructor(private readonly storageService: StorageService) {}

  private groupPath(id: string): string {
    return this.storageService.resolvePath('groups', `${id}.json`);
  }

  async create(dto: CreateGroupDto): Promise<GroupEntity> {
    const id = uuidv4();
    const group: GroupEntity = {
      id,
      name: dto.name,
      permissions: dto.permissions,
      userIds: dto.userIds || [],
    };

    await this.storageService.writeJson(this.groupPath(id), group);
    return group;
  }

  async findAll(): Promise<GroupEntity[]> {
    const files = await this.storageService.listFiles(
      this.storageService.resolvePath('groups'),
      '.json',
    );
    const groups: GroupEntity[] = [];
    for (const file of files) {
      const group = await this.storageService.readJson<GroupEntity>(
        this.storageService.resolvePath('groups', file),
      );
      if (group) groups.push(group);
    }
    return groups;
  }

  async findOne(id: string): Promise<GroupEntity> {
    const group = await this.storageService.readJson<GroupEntity>(this.groupPath(id));
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    return group;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupEntity> {
    const group = await this.findOne(id);
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.permissions !== undefined) group.permissions = dto.permissions;
    if (dto.userIds !== undefined) group.userIds = dto.userIds;

    await this.storageService.writeJson(this.groupPath(id), group);
    return group;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.storageService.deleteFile(this.groupPath(id));
  }
}
