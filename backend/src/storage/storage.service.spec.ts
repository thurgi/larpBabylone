import { StorageService } from './storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('StorageService', () => {
  let service: StorageService;
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-test-'));
    process.env.DATA_DIR = dataDir;
    service = new StorageService();
    await service.onModuleInit();
  });

  afterEach(async () => {
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  describe('onModuleInit', () => {
    it('should create documents, groups, and users directories', async () => {
      const docs = await fs.stat(path.join(dataDir, 'documents'));
      expect(docs.isDirectory()).toBe(true);
      const groups = await fs.stat(path.join(dataDir, 'groups'));
      expect(groups.isDirectory()).toBe(true);
      const users = await fs.stat(path.join(dataDir, 'users'));
      expect(users.isDirectory()).toBe(true);
    });
  });

  describe('readJson / writeJson', () => {
    it('should write and read back JSON data', async () => {
      const filePath = path.join(dataDir, 'test.json');
      await service.writeJson(filePath, { hello: 'world' });
      const result = await service.readJson<{ hello: string }>(filePath);
      expect(result).toEqual({ hello: 'world' });
    });

    it('should return null for non-existent file', async () => {
      const result = await service.readJson(path.join(dataDir, 'nope.json'));
      expect(result).toBeNull();
    });
  });

  describe('readText / writeText', () => {
    it('should write and read back text', async () => {
      const filePath = path.join(dataDir, 'test.md');
      await service.writeText(filePath, '# Hello');
      const result = await service.readText(filePath);
      expect(result).toBe('# Hello');
    });

    it('should return null for non-existent file', async () => {
      const result = await service.readText(path.join(dataDir, 'nope.md'));
      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      const filePath = path.join(dataDir, 'del.json');
      await service.writeJson(filePath, { a: 1 });
      await service.deleteFile(filePath);
      const result = await service.readJson(filePath);
      expect(result).toBeNull();
    });

    it('should not throw for non-existent file', async () => {
      await expect(
        service.deleteFile(path.join(dataDir, 'nope.json')),
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteDir', () => {
    it('should delete a directory recursively', async () => {
      const dirPath = path.join(dataDir, 'subdir');
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(path.join(dirPath, 'a.txt'), 'hello');
      await service.deleteDir(dirPath);
      await expect(fs.stat(dirPath)).rejects.toThrow();
    });
  });

  describe('listDirs', () => {
    it('should return directory names', async () => {
      await fs.mkdir(path.join(dataDir, 'dirA'));
      await fs.mkdir(path.join(dataDir, 'dirB'));
      await fs.writeFile(path.join(dataDir, 'file.txt'), 'x');
      const dirs = await service.listDirs(dataDir);
      expect(dirs.sort()).toEqual(
        expect.arrayContaining(['dirA', 'dirB']),
      );
      expect(dirs).not.toContain('file.txt');
    });

    it('should return empty for non-existent dir', async () => {
      const dirs = await service.listDirs(path.join(dataDir, 'nope'));
      expect(dirs).toEqual([]);
    });
  });

  describe('listFiles', () => {
    it('should list files with optional extension filter', async () => {
      await fs.writeFile(path.join(dataDir, 'a.json'), '{}');
      await fs.writeFile(path.join(dataDir, 'b.txt'), 'x');
      const all = await service.listFiles(dataDir);
      expect(all).toContain('a.json');
      expect(all).toContain('b.txt');

      const jsonOnly = await service.listFiles(dataDir, '.json');
      expect(jsonOnly).toContain('a.json');
      expect(jsonOnly).not.toContain('b.txt');
    });
  });

  describe('resolvePath', () => {
    it('should resolve relative to data dir', () => {
      const result = service.resolvePath('documents', 'abc', 'metadata.json');
      expect(result).toBe(path.join(dataDir, 'documents', 'abc', 'metadata.json'));
    });
  });
});
