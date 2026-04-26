import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentEntity {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  groupIds: string[];
  folderId: string | null;
}

@Injectable()
export class DocumentsService {
  constructor(private readonly storageService: StorageService) {}

  async create(dto: CreateDocumentDto): Promise<DocumentEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const doc: DocumentEntity = {
      id,
      title: dto.title,
      createdAt: now,
      updatedAt: now,
      groupIds: dto.groupIds || [],
      folderId: dto.folderId || null,
    };

    await this.storageService.ensureDir(
      this.storageService.resolvePath('documents', id, 'versions'),
    );
    await this.storageService.writeJson(
      this.storageService.resolvePath('documents', id, 'metadata.json'),
      doc,
    );

    return doc;
  }

  async findAll(): Promise<DocumentEntity[]> {
    const dirs = await this.storageService.listDirs(
      this.storageService.resolvePath('documents'),
    );
    const docs: DocumentEntity[] = [];
    for (const dir of dirs) {
      const doc = await this.storageService.readJson<DocumentEntity>(
        this.storageService.resolvePath('documents', dir, 'metadata.json'),
      );
      if (doc) docs.push(doc);
    }
    return docs;
  }

  async findOne(id: string): Promise<DocumentEntity> {
    const doc = await this.storageService.readJson<DocumentEntity>(
      this.storageService.resolvePath('documents', id, 'metadata.json'),
    );
    if (!doc) {
      throw new NotFoundException('Document introuvable');
    }
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<DocumentEntity> {
    const doc = await this.findOne(id);
    if (dto.title !== undefined) doc.title = dto.title;
    if (dto.groupIds !== undefined) doc.groupIds = dto.groupIds;
    if (dto.folderId !== undefined) doc.folderId = dto.folderId;
    doc.updatedAt = new Date().toISOString();

    await this.storageService.writeJson(
      this.storageService.resolvePath('documents', id, 'metadata.json'),
      doc,
    );

    return doc;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.storageService.deleteDir(
      this.storageService.resolvePath('documents', id),
    );
  }
}
