import { AuthService, UserPayload } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { StorageService } from '../storage/storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let storageService: StorageService;
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'auth-test-'));
    process.env.DATA_DIR = dataDir;
    process.env.ADMIN_USERNAME = 'admin-user';

    storageService = new StorageService();
    await storageService.onModuleInit();

    jwtService = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '1h' } });
    service = new AuthService(jwtService, storageService);
  });

  afterEach(async () => {
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  describe('findOrCreateUser', () => {
    it('should create a new user if not found', async () => {
      const user = await service.findOrCreateUser({
        username: 'bob',
        email: 'bob@test.com',
        provider: 'discord',
        providerId: 'disc-1',
      });

      expect(user).toHaveProperty('id');
      expect(user.username).toBe('bob');
      expect(user.provider).toBe('discord');
    });

    it('should return existing user on second call', async () => {
      const first = await service.findOrCreateUser({
        username: 'alice',
        provider: 'google',
        providerId: 'goo-1',
      });
      const second = await service.findOrCreateUser({
        username: 'alice',
        provider: 'google',
        providerId: 'goo-1',
      });

      expect(second.id).toBe(first.id);
    });
  });

  describe('login', () => {
    it('should return an access token and user', async () => {
      const user: UserPayload = {
        id: 'uid-1',
        username: 'test',
        provider: 'discord',
      };
      const result = await service.login(user);
      expect(result).toHaveProperty('accessToken');
      expect(result.user).toEqual(user);
      expect(typeof result.accessToken).toBe('string');
    });
  });

  describe('getProfile', () => {
    it('should return user from disk', async () => {
      const created = await service.findOrCreateUser({
        username: 'charlie',
        provider: 'discord',
        providerId: 'disc-2',
      });
      const profile = await service.getProfile(created.id);
      expect(profile).not.toBeNull();
      expect(profile!.username).toBe('charlie');
    });

    it('should return null for unknown user', async () => {
      const profile = await service.getProfile('nonexistent-id');
      expect(profile).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin username', () => {
      expect(service.isAdmin('admin-user')).toBe(true);
    });

    it('should return false for other usernames', () => {
      expect(service.isAdmin('bob')).toBe(false);
    });

    it('should return false when ADMIN_USERNAME is not set', () => {
      delete process.env.ADMIN_USERNAME;
      expect(service.isAdmin('admin-user')).toBe(false);
    });
  });
});
