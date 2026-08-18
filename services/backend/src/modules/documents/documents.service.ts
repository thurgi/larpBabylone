import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FileStorageService } from '../../core/storage/files/file-storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(dto: CreateDocumentDto): Promise<DocumentEntity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const doc = new DocumentEntity();
    doc.id = id;
    doc.title = dto.title;
    doc.createdAt = now;
    doc.updatedAt = now;
    doc.groupIds = dto.groupIds || [];
    doc.folderId = dto.folderId || null;

    // Ensure the content directory exists for versions
    await this.fileStorageService.ensureDir(
      this.fileStorageService.resolvePath('documents', id, 'versions'),
    );

    return this.documentsRepository.save(doc);
  }

  async findAll(): Promise<DocumentEntity[]> {
    return this.documentsRepository.find();
  }

  async findOne(id: string): Promise<DocumentEntity> {
    const doc = await this.documentsRepository.findOneBy({ id });
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
    return this.documentsRepository.save(doc);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.documentsRepository.delete(id);
    // Also remove the content directory (markdown files)
    await this.fileStorageService.deleteDir(
      this.fileStorageService.resolvePath('documents', id),
    );
  }
}
