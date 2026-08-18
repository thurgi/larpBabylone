// shared/user-module/src/services/users.service.spec.ts
// Tests unitaires du UsersService

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { USER_MODULE_OPTIONS, UserModuleOptions } from '../types/user-module.types';

describe('UsersService', () => {
  let service: UsersService;
  const mockOptions: UserModuleOptions = {
    authServiceUrl: 'http://localhost:3001',
    groupsServiceUrl: 'http://localhost:3000',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_MODULE_OPTIONS,
          useValue: mockOptions,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('isAdmin', () => {
    it('should return true for admin username', () => {
      process.env.ADMIN_USERNAME = 'admin@example.com';
      const result = service.isAdmin('admin@example.com');
      expect(result).toBe(true);
    });

    it('should return false for non-admin username', () => {
      process.env.ADMIN_USERNAME = 'admin@example.com';
      const result = service.isAdmin('user@example.com');
      expect(result).toBe(false);
    });

    it('should return false when ADMIN_USERNAME not set', () => {
      delete process.env.ADMIN_USERNAME;
      const result = service.isAdmin('anyone@example.com');
      expect(result).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should return user profile on success', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        provider: 'discord' as const,
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await service.getProfile('123');
      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/users/123');
    });

    it('should return null on 404', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await service.getProfile('non-existent');
      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(
        new Error('Network error'),
      );

      const result = await service.getProfile('123');
      expect(result).toBeNull();
    });
  });

  describe('findAllUsers', () => {
    it('should return list of users', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', provider: 'discord' as const },
        { id: '2', username: 'user2', provider: 'google' as const },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      });

      const result = await service.findAllUsers();
      expect(result).toEqual(mockUsers);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/users');
    });

    it('should throw on fetch error', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(service.findAllUsers()).rejects.toThrow();
    });
  });

  describe('getAllGroupes', () => {
    it('should return list of groups', async () => {
      const mockGroups = [
        {
          id: 'g1',
          userIds: ['u1', 'u2'],
          permissions: { admin: true, documents: { read: true } },
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      });

      const result = await service.getAllGroupes();
      expect(result).toEqual(mockGroups);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/groups',
      );
    });

    it('should use authServiceUrl if groupsServiceUrl not provided', async () => {
      const serviceWithoutGroupsUrl = new UsersService({
        authServiceUrl: 'http://localhost:3001',
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await serviceWithoutGroupsUrl.getAllGroupes();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/groups',
      );
    });
  });

  describe('isGroupAdmin', () => {
    it('should return true if user is admin in a group', async () => {
      const mockGroups = [
        {
          id: 'g1',
          userIds: ['u1', 'u2'],
          permissions: { admin: true, documents: { read: true } },
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      });

      const result = await service.isGroupAdmin('u1');
      expect(result).toBe(true);
    });

    it('should return false if user is not group admin', async () => {
      const mockGroups = [
        {
          id: 'g1',
          userIds: ['u1', 'u2'],
          permissions: { admin: false, documents: { read: true } },
        },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      });

      const result = await service.isGroupAdmin('u1');
      expect(result).toBe(false);
    });
  });
});
