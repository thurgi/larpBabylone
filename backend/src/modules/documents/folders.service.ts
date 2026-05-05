import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderEntity } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(FolderEntity)
    private readonly foldersRepository: Repository<FolderEntity>,
  ) {}

  async create(dto: CreateFolderDto): Promise<FolderEntity> {
    if (dto.parentId) {
      await this.findOne(dto.parentId);
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const folder = new FolderEntity();
    folder.id = id;
    folder.name = dto.name;
    folder.parentId = dto.parentId || null;
    folder.createdAt = now;
    folder.updatedAt = now;

    return this.foldersRepository.save(folder);
  }

  async findAll(): Promise<FolderEntity[]> {
    return this.foldersRepository.find();
  }

  async findOne(id: string): Promise<FolderEntity> {
    const folder = await this.foldersRepository.findOneBy({ id });
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

    return this.foldersRepository.save(folder);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Recursively delete child folders
    const allFolders = await this.findAll();
    const childIds = this.getDescendantIds(id, allFolders);
    for (const childId of childIds) {
      await this.foldersRepository.delete(childId);
    }

    await this.foldersRepository.delete(id);
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
