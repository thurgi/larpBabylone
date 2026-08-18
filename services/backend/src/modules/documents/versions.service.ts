import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VersionEntity } from './entities/version.entity';
import { DocumentEntity } from './entities/document.entity';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { FileStorageService } from '../../core/storage/files/file-storage.service';
import { v4 as uuidv4 } from 'uuid';

export interface VersionFull {
  id: string;
  documentId: string;
  title: string;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  content: string;
}

@Injectable()
export class VersionsService {
  constructor(
    @InjectRepository(VersionEntity)
    private readonly versionsRepository: Repository<VersionEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  private contentPath(documentId: string, versionId: string): string {
    return this.fileStorageService.resolvePath('documents', documentId, 'versions', versionId, 'content.md');
  }

  private versionDir(documentId: string, versionId: string): string {
    return this.fileStorageService.resolvePath('documents', documentId, 'versions', versionId);
  }

  async create(documentId: string, dto: CreateVersionDto, authorId: string): Promise<VersionFull> {
    const doc = await this.documentsRepository.findOneBy({ id: documentId });
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }

    // Auto-compute version number
    const existing = await this.versionsRepository.findBy({ documentId });
    const maxNumber = existing.reduce((max, v) => {
      const num = parseInt(v.title || '0', 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const title = String(maxNumber + 1);

    const id = uuidv4();
    const now = new Date().toISOString();
    const content = dto.content ?? '';

    const version = new VersionEntity();
    version.id = id;
    version.documentId = documentId;
    version.title = title;
    version.isValid = false;
    version.createdAt = now;
    version.updatedAt = now;
    version.authorId = authorId;

    await this.versionsRepository.save(version);
    await this.fileStorageService.writeText(this.contentPath(documentId, id), content);

    return { ...version.toJSON(), content } as VersionFull;
  }

  async findAll(documentId: string): Promise<VersionEntity[]> {
    const doc = await this.documentsRepository.findOneBy({ id: documentId });
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }
    return this.versionsRepository.findBy({ documentId });
  }

  async findOne(documentId: string, versionId: string): Promise<VersionFull> {
    const version = await this.versionsRepository.findOneBy({ id: versionId, documentId });
    if (!version) {
      throw new NotFoundException('Version introuvable');
    }
    const content = (await this.fileStorageService.readText(this.contentPath(documentId, versionId))) || '';
    return { ...version.toJSON(), content } as VersionFull;
  }

  async update(documentId: string, versionId: string, dto: UpdateVersionDto): Promise<VersionFull> {
    const version = await this.versionsRepository.findOneBy({ id: versionId, documentId });
    if (!version) {
      throw new NotFoundException('Version introuvable');
    }

    if (dto.title !== undefined) version.title = dto.title;
    version.updatedAt = new Date().toISOString();
    await this.versionsRepository.save(version);

    if (dto.content !== undefined) {
      await this.fileStorageService.writeText(this.contentPath(documentId, versionId), dto.content);
    }

    const content = (await this.fileStorageService.readText(this.contentPath(documentId, versionId))) || '';
    return { ...version.toJSON(), content } as VersionFull;
  }

  async remove(documentId: string, versionId: string): Promise<void> {
    const version = await this.versionsRepository.findOneBy({ id: versionId, documentId });
    if (!version) {
      throw new NotFoundException('Version introuvable');
    }
    await this.versionsRepository.delete(versionId);
    await this.fileStorageService.deleteDir(this.versionDir(documentId, versionId));
  }

  async findCurrentContent(documentId: string): Promise<string> {
    const doc = await this.documentsRepository.findOneBy({ id: documentId });
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }

    const validVersion = await this.versionsRepository.findOneBy({ documentId, isValid: true });
    if (!validVersion) {
      throw new NotFoundException('Aucune version active');
    }

    const content = (await this.fileStorageService.readText(this.contentPath(documentId, validVersion.id))) || '';
    return content;
  }

  async validate(documentId: string, versionId: string): Promise<VersionEntity> {
    const version = await this.versionsRepository.findOneBy({ id: versionId, documentId });
    if (!version) {
      throw new NotFoundException('Version introuvable');
    }

    // Invalidate all other versions
    const allVersions = await this.versionsRepository.findBy({ documentId });
    for (const v of allVersions) {
      if (v.isValid) {
        v.isValid = false;
        v.updatedAt = new Date().toISOString();
        await this.versionsRepository.save(v);
      }
    }

    // Validate target version
    version.isValid = true;
    version.updatedAt = new Date().toISOString();
    await this.versionsRepository.save(version);

    return version;
  }
}
