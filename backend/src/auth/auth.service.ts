import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';

export interface UserPayload {
  id: string;
  username: string;
  email?: string;
  provider: 'discord' | 'google';
  providerId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly storageService: StorageService,
  ) {}

  async findOrCreateUser(profile: {
    username: string;
    email?: string;
    provider: 'discord' | 'google';
    providerId: string;
  }): Promise<UserPayload> {
    const usersDir = this.storageService.resolvePath('users');
    const files = await this.storageService.listFiles(usersDir, '.json');

    for (const file of files) {
      const user = await this.storageService.readJson<UserPayload>(
        this.storageService.resolvePath('users', file),
      );
      if (user && user.provider === profile.provider && user.providerId === profile.providerId) {
        return user;
      }
    }

    const user: UserPayload = {
      id: uuidv4(),
      username: profile.username,
      email: profile.email,
      provider: profile.provider,
      providerId: profile.providerId,
    };

    await this.storageService.writeJson(
      this.storageService.resolvePath('users', `${user.id}.json`),
      user,
    );

    return user;
  }

  async login(user: UserPayload): Promise<{ accessToken: string; user: UserPayload }> {
    const payload = { sub: user.id, username: user.username };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async getProfile(userId: string): Promise<UserPayload | null> {
    return this.storageService.readJson<UserPayload>(
      this.storageService.resolvePath('users', `${userId}.json`),
    );
  }

  async findAllUsers(): Promise<UserPayload[]> {
    const usersDir = this.storageService.resolvePath('users');
    const files = await this.storageService.listFiles(usersDir, '.json');
    const users: UserPayload[] = [];
    for (const file of files) {
      const user = await this.storageService.readJson<UserPayload>(
        this.storageService.resolvePath('users', file),
      );
      if (user) users.push(user);
    }
    return users;
  }

  isAdmin(username: string): boolean {
    const adminUsername = process.env.ADMIN_USERNAME;
    return !!adminUsername && username === adminUsername;
  }

  async isGroupAdmin(userId: string): Promise<boolean> {
    const groupsDir = this.storageService.resolvePath('groups');
    const files = await this.storageService.listFiles(groupsDir, '.json');
    for (const file of files) {
      const group = await this.storageService.readJson<{
        userIds: string[];
        permissions: { admin?: boolean };
      }>(this.storageService.resolvePath('groups', file));
      if (group && group.userIds.includes(userId) && group.permissions.admin) {
        return true;
      }
    }
    return false;
  }
}
