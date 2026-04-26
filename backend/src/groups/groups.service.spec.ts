import { GroupsService } from './groups.service';
import { StorageService } from '../storage/storage.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const validPermissions = {
  documents: { create: true, read: true, update: true, delete: false },
  versions: { create: true, read: true, update: true, delete: false },
};

describe('GroupsService', () => {
  let service: GroupsService;
  let storageService: StorageService;
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'groups-test-'));
    process.env.DATA_DIR = dataDir;
    storageService = new StorageService();
    await storageService.onModuleInit();
    service = new GroupsService(storageService);
  });

  afterEach(async () => {
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  describe('create', () => {
    it('should create a group', async () => {
      const group = await service.create({
        name: 'Editors',
        permissions: validPermissions,
        userIds: ['u1'],
      });
      expect(group).toHaveProperty('id');
      expect(group.name).toBe('Editors');
      expect(group.userIds).toEqual(['u1']);
    });
  });

  describe('findAll', () => {
    it('should return empty array initially', async () => {
      const groups = await service.findAll();
      expect(groups).toEqual([]);
    });

    it('should return created groups', async () => {
      await service.create({ name: 'A', permissions: validPermissions });
      await service.create({ name: 'B', permissions: validPermissions });
      const groups = await service.findAll();
      expect(groups).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return group by id', async () => {
      const created = await service.create({ name: 'G', permissions: validPermissions });
      const found = await service.findOne(created.id);
      expect(found.id).toBe(created.id);
      expect(found.name).toBe('G');
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update group name', async () => {
      const created = await service.create({ name: 'Old', permissions: validPermissions });
      const updated = await service.update(created.id, { name: 'New' });
      expect(updated.name).toBe('New');
      // Permissions should remain unchanged
      expect(updated.permissions.documents.read).toBe(true);
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.update('nope', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a group', async () => {
      const created = await service.create({ name: 'ToDelete', permissions: validPermissions });
      await service.remove(created.id);
      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for unknown id', async () => {
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });
  });
});
