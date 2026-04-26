import { DocumentsService } from './documents.service';
import { StorageService } from '../storage/storage.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let storageService: StorageService;
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'docs-test-'));
    process.env.DATA_DIR = dataDir;
    storageService = new StorageService();
    await storageService.onModuleInit();
    service = new DocumentsService(storageService);
  });

  afterEach(async () => {
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  describe('create', () => {
    it('should create a document and return it', async () => {
      const doc = await service.create({ title: 'Doc 1' });
      expect(doc).toHaveProperty('id');
      expect(doc.title).toBe('Doc 1');
      expect(doc.groupIds).toEqual([]);
      expect(doc.createdAt).toBeDefined();
    });

    it('should store groupIds when provided', async () => {
      const doc = await service.create({ title: 'Doc', groupIds: ['aaa'] });
      expect(doc.groupIds).toEqual(['aaa']);
    });
  });

  describe('findAll', () => {
    it('should return empty array initially', async () => {
      const docs = await service.findAll();
      expect(docs).toEqual([]);
    });

    it('should return created documents', async () => {
      await service.create({ title: 'A' });
      await service.create({ title: 'B' });
      const docs = await service.findAll();
      expect(docs).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return document by id', async () => {
      const created = await service.create({ title: 'Test' });
      const found = await service.findOne(created.id);
      expect(found.id).toBe(created.id);
      expect(found.title).toBe('Test');
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update document title', async () => {
      const created = await service.create({ title: 'Old' });
      const updated = await service.update(created.id, { title: 'New' });
      expect(updated.title).toBe('New');
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.update('nope', { title: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a document', async () => {
      const created = await service.create({ title: 'ToDelete' });
      await service.remove(created.id);
      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });
  });
});
