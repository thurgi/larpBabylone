import { Injectable, Inject, Logger } from '@nestjs/common';
import { UserPayload } from '../types/user.types';
import { GroupMembership } from '../types/group.types';
import { isSuperAdmin, isGroupAdmin as checkGroupAdmin } from '../utils/authorization.utils';
import { USER_MODULE_OPTIONS, UserModuleOptions } from '../types/user-module.types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(USER_MODULE_OPTIONS) private readonly options: UserModuleOptions,
  ) {}

  async getProfile(userId: string): Promise<UserPayload | null> {
    try {
      const response = await fetch(`${this.options.authServiceUrl}/users/${userId}`);
      if (!response.ok) return null;
      return response.json() as Promise<UserPayload>;
    } catch (err) {
      this.logger.error(`getProfile(${userId}) failed`, err);
      return null;
    }
  }

  async findAllUsers(): Promise<UserPayload[]> {
    const response = await fetch(`${this.options.authServiceUrl}/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }
    return response.json() as Promise<UserPayload[]>;
  }

  async getAllGroupes(): Promise<GroupMembership[]> {
    const baseUrl = this.options.groupsServiceUrl ?? this.options.authServiceUrl;
    const response = await fetch(`${baseUrl}/groups`);
    if (!response.ok) {
      throw new Error(`Failed to fetch groups: ${response.status}`);
    }
    return response.json() as Promise<GroupMembership[]>;
  }

  isAdmin(username: string): boolean {
    return isSuperAdmin(username, process.env.ADMIN_USERNAME);
  }

  async isGroupAdmin(userId: string): Promise<boolean> {
    const groups = await this.getAllGroupes();
    return checkGroupAdmin(userId, groups);
  }
}
