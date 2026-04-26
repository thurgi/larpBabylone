import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private dataDir: string;

  constructor() {
    this.dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  }

  async onModuleInit() {
    await this.ensureDir(path.join(this.dataDir, 'documents'));
    await this.ensureDir(path.join(this.dataDir, 'groups'));
    await this.ensureDir(path.join(this.dataDir, 'users'));
  }

  getDataDir(): string {
    return this.dataDir;
  }

  async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async readJson<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  async writeJson<T>(filePath: string, data: T): Promise<void> {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async readText(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  async writeText(filePath: string, content: string): Promise<void> {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore if not found
    }
  }

  async deleteDir(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch {
      // ignore if not found
    }
  }

  async listDirs(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return [];
    }
  }

  async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && (!extension || e.name.endsWith(extension)))
        .map((e) => e.name);
    } catch {
      return [];
    }
  }

  resolvePath(...segments: string[]): string {
    return path.join(this.dataDir, ...segments);
  }
}
