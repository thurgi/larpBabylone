import { VersionsService } from './versions.service';
import { StorageService } from '../storage/storage.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('VersionsService', () => {
  let service: VersionsService;
  let storageService: StorageService;
  let dataDir: string;
  let documentId: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'versions-test-'));
    process.env.DATA_DIR = dataDir;
    storageService = new StorageService();
    await storageService.onModuleInit();
    service = new VersionsService(storageService);

    // Create a document manually for testing
    documentId = 'test-doc-id';
    const docDir = storageService.resolvePath('documents', documentId);
    await storageService.writeJson(`${docDir}/metadata.json`, {
      id: documentId,
      title: 'Test Doc',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groupIds: [],
    });
    await fs.mkdir(`${docDir}/versions`, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  describe('create', () => {
    it('should create a version with auto-incremental number', async () => {
      const v = await service.create(documentId, { content: '# Hello' }, 'author-1');
      expect(v).toHaveProperty('id');
      expect(v.documentId).toBe(documentId);
      expect(v.title).toBe('1');
      expect(v.content).toBe('# Hello');
      expect(v.isValid).toBe(false);
      expect(v.authorId).toBe('author-1');
    });

    it('should increment version number', async () => {
      await service.create(documentId, { content: 'a' }, 'u1');
      const v2 = await service.create(documentId, { content: 'b' }, 'u1');
      const v3 = await service.create(documentId, { content: 'c' }, 'u1');
      expect(v2.title).toBe('2');
      expect(v3.title).toBe('3');
    });

    it('should create version with empty content when not provided', async () => {
      const v = await service.create(documentId, {}, 'author-1');
      expect(v.content).toBe('');
      expect(v.title).toBe('1');
    });

    it('should throw when document does not exist', async () => {
      await expect(
        service.create('nonexistent', { content: 'x' }, 'author'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return empty array initially', async () => {
      const versions = await service.findAll(documentId);
      expect(versions).toEqual([]);
    });

    it('should return created versions', async () => {
      await service.create(documentId, { content: 'a' }, 'u1');
      await service.create(documentId, { content: 'b' }, 'u1');
      const versions = await service.findAll(documentId);
      expect(versions).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return version with content', async () => {
      const created = await service.create(documentId, { content: 'test content' }, 'u1');
      const found = await service.findOne(documentId, created.id);
      expect(found.content).toBe('test content');
      expect(found.id).toBe(created.id);
    });

    it('should throw NotFoundException for unknown version', async () => {
      await expect(service.findOne(documentId, 'nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update content', async () => {
      const created = await service.create(documentId, { content: 'old' }, 'u1');
      const updated = await service.update(documentId, created.id, { content: 'new' });
      expect(updated.title).toBe('1');
      expect(updated.content).toBe('new');
    });

    it('should throw NotFoundException for unknown version', async () => {
      await expect(service.update(documentId, 'nope', { title: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a version', async () => {
      const created = await service.create(documentId, { content: 'x' }, 'u1');
      await service.remove(documentId, created.id);
      await expect(service.findOne(documentId, created.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validate', () => {
    it('should set a version as valid', async () => {
      const v = await service.create(documentId, { content: 'a' }, 'u1');
      const validated = await service.validate(documentId, v.id);
      expect(validated.isValid).toBe(true);
    });

    it('should invalidate other versions when validating one', async () => {
      const v1 = await service.create(documentId, { content: 'a' }, 'u1');
      const v2 = await service.create(documentId, { content: 'b' }, 'u1');
      await service.validate(documentId, v1.id);
      await service.validate(documentId, v2.id);

      const found1 = await service.findOne(documentId, v1.id);
      const found2 = await service.findOne(documentId, v2.id);
      expect(found1.isValid).toBe(false);
      expect(found2.isValid).toBe(true);
    });

    it('should throw NotFoundException for unknown version', async () => {
      await expect(service.validate(documentId, 'nope')).rejects.toThrow(NotFoundException);
    });
  });
});
