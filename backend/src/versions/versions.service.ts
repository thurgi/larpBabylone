import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { v4 as uuidv4 } from 'uuid';

export interface VersionEntity {
  id: string;
  documentId: string;
  title?: string;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

export interface VersionFull extends VersionEntity {
  content: string;
}

@Injectable()
export class VersionsService {
  constructor(private readonly storageService: StorageService) {}

  private versionsDir(documentId: string): string {
    return this.storageService.resolvePath('documents', documentId, 'versions');
  }

  private versionDir(documentId: string, versionId: string): string {
    return this.storageService.resolvePath('documents', documentId, 'versions', versionId);
  }

  async create(documentId: string, dto: CreateVersionDto, authorId: string): Promise<VersionFull> {
    const docMeta = await this.storageService.readJson(
      this.storageService.resolvePath('documents', documentId, 'metadata.json'),
    );
    if (!docMeta) {
      throw new NotFoundException('Document introuvable');
    }

    // Auto-compute version number
    const existing = await this.findAll(documentId);
    const maxNumber = existing.reduce((max, v) => {
      const num = parseInt(v.title || '0', 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const title = String(maxNumber + 1);

    const id = uuidv4();
    const now = new Date().toISOString();
    const content = dto.content ?? '';
    const version: VersionEntity = {
      id,
      documentId,
      title,
      isValid: false,
      createdAt: now,
      updatedAt: now,
      authorId,
    };

    const dir = this.versionDir(documentId, id);
    await this.storageService.writeJson(`${dir}/metadata.json`, version);
    await this.storageService.writeText(`${dir}/content.md`, content);

    return { ...version, content };
  }

  async findAll(documentId: string): Promise<VersionEntity[]> {
    const docMeta = await this.storageService.readJson(
      this.storageService.resolvePath('documents', documentId, 'metadata.json'),
    );
    if (!docMeta) {
      throw new NotFoundException('Document introuvable');
    }

    const dirs = await this.storageService.listDirs(this.versionsDir(documentId));
    const versions: VersionEntity[] = [];
    for (const dir of dirs) {
      const meta = await this.storageService.readJson<VersionEntity>(
        `${this.versionDir(documentId, dir)}/metadata.json`,
      );
      if (meta) versions.push(meta);
    }
    return versions;
  }

  async findOne(documentId: string, versionId: string): Promise<VersionFull> {
    const dir = this.versionDir(documentId, versionId);
    const meta = await this.storageService.readJson<VersionEntity>(`${dir}/metadata.json`);
    if (!meta) {
      throw new NotFoundException('Version introuvable');
    }
    const content = (await this.storageService.readText(`${dir}/content.md`)) || '';
    return { ...meta, content };
  }

  async update(documentId: string, versionId: string, dto: UpdateVersionDto): Promise<VersionFull> {
    const dir = this.versionDir(documentId, versionId);
    const meta = await this.storageService.readJson<VersionEntity>(`${dir}/metadata.json`);
    if (!meta) {
      throw new NotFoundException('Version introuvable');
    }

    if (dto.title !== undefined) meta.title = dto.title;
    meta.updatedAt = new Date().toISOString();
    await this.storageService.writeJson(`${dir}/metadata.json`, meta);

    if (dto.content !== undefined) {
      await this.storageService.writeText(`${dir}/content.md`, dto.content);
    }

    const content = (await this.storageService.readText(`${dir}/content.md`)) || '';
    return { ...meta, content };
  }

  async remove(documentId: string, versionId: string): Promise<void> {
    const dir = this.versionDir(documentId, versionId);
    const meta = await this.storageService.readJson<VersionEntity>(`${dir}/metadata.json`);
    if (!meta) {
      throw new NotFoundException('Version introuvable');
    }
    await this.storageService.deleteDir(dir);
  }

  async findCurrentContent(documentId: string): Promise<string> {
    const docMeta = await this.storageService.readJson(
      this.storageService.resolvePath('documents', documentId, 'metadata.json'),
    );
    if (!docMeta) {
      throw new NotFoundException('Document introuvable');
    }

    const dirs = await this.storageService.listDirs(this.versionsDir(documentId));
    for (const dir of dirs) {
      const meta = await this.storageService.readJson<VersionEntity>(
        `${this.versionDir(documentId, dir)}/metadata.json`,
      );
      if (meta && meta.isValid) {
        const content = (await this.storageService.readText(`${this.versionDir(documentId, dir)}/content.md`)) || '';
        return content;
      }
    }

    throw new NotFoundException('Aucune version active');
  }

  async validate(documentId: string, versionId: string): Promise<VersionEntity> {
    const dir = this.versionDir(documentId, versionId);
    const meta = await this.storageService.readJson<VersionEntity>(`${dir}/metadata.json`);
    if (!meta) {
      throw new NotFoundException('Version introuvable');
    }

    // Invalidate all other versions
    const dirs = await this.storageService.listDirs(this.versionsDir(documentId));
    for (const d of dirs) {
      const otherMeta = await this.storageService.readJson<VersionEntity>(
        `${this.versionDir(documentId, d)}/metadata.json`,
      );
      if (otherMeta && otherMeta.isValid) {
        otherMeta.isValid = false;
        otherMeta.updatedAt = new Date().toISOString();
        await this.storageService.writeJson(
          `${this.versionDir(documentId, d)}/metadata.json`,
          otherMeta,
        );
      }
    }

    // Validate target version
    meta.isValid = true;
    meta.updatedAt = new Date().toISOString();
    await this.storageService.writeJson(`${dir}/metadata.json`, meta);

    return meta;
  }
}
