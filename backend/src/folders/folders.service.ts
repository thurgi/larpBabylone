import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { v4 as uuidv4 } from 'uuid';

export interface FolderEntity {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class FoldersService {
  constructor(private readonly storageService: StorageService) {}

  private folderPath(id: string): string {
    return this.storageService.resolvePath('folders', `${id}.json`);
  }

  async create(dto: CreateFolderDto): Promise<FolderEntity> {
    if (dto.parentId) {
      await this.findOne(dto.parentId);
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const folder: FolderEntity = {
      id,
      name: dto.name,
      parentId: dto.parentId || null,
      createdAt: now,
      updatedAt: now,
    };

    await this.storageService.writeJson(this.folderPath(id), folder);
    return folder;
  }

  async findAll(): Promise<FolderEntity[]> {
    const files = await this.storageService.listFiles(
      this.storageService.resolvePath('folders'),
      '.json',
    );
    const folders: FolderEntity[] = [];
    for (const file of files) {
      const folder = await this.storageService.readJson<FolderEntity>(
        this.storageService.resolvePath('folders', file),
      );
      if (folder) folders.push(folder);
    }
    return folders;
  }

  async findOne(id: string): Promise<FolderEntity> {
    const folder = await this.storageService.readJson<FolderEntity>(this.folderPath(id));
    if (!folder) {
      throw new NotFoundException('Dossier introuvable');
    }
    return folder;
  }

  async update(id: string, dto: UpdateFolderDto): Promise<FolderEntity> {
    const folder = await this.findOne(id);

    if (dto.parentId !== undefined) {
      if (dto.parentId !== null) {
        if (dto.parentId === id) {
          throw new BadRequestException('Un dossier ne peut pas être son propre parent');
        }
        await this.findOne(dto.parentId);
        const isDescendant = await this.isDescendantOf(dto.parentId, id);
        if (isDescendant) {
          throw new BadRequestException('Référence circulaire détectée');
        }
      }
      folder.parentId = dto.parentId;
    }

    if (dto.name !== undefined) folder.name = dto.name;
    folder.updatedAt = new Date().toISOString();

    await this.storageService.writeJson(this.folderPath(id), folder);
    return folder;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Recursively delete child folders
    const allFolders = await this.findAll();
    const childIds = this.getDescendantIds(id, allFolders);
    for (const childId of childIds) {
      await this.storageService.deleteFile(this.folderPath(childId));
    }

    await this.storageService.deleteFile(this.folderPath(id));
  }

  private async isDescendantOf(folderId: string, ancestorId: string): Promise<boolean> {
    const allFolders = await this.findAll();
    let currentId: string | null = folderId;
    while (currentId) {
      if (currentId === ancestorId) return true;
      const current = allFolders.find((f) => f.id === currentId);
      currentId = current?.parentId || null;
    }
    return false;
  }

  private getDescendantIds(parentId: string, allFolders: FolderEntity[]): string[] {
    const children = allFolders.filter((f) => f.parentId === parentId);
    const result: string[] = [];
    for (const child of children) {
      result.push(child.id);
      result.push(...this.getDescendantIds(child.id, allFolders));
    }
    return result;
  }
}
