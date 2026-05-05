import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { GroupEntity } from '../groups/entities/group.entity';
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
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepository: Repository<GroupEntity>,
  ) {}

  async findOrCreateUser(profile: {
    username: string;
    email?: string;
    provider: 'discord' | 'google';
    providerId: string;
  }): Promise<UserPayload> {
    const allUsers = await this.usersRepository.find();
    const existing = allUsers.find(
      (u) => u.provider === profile.provider && u.providerId === profile.providerId,
    );
    if (existing) {
      return existing.toJSON() as UserPayload;
    }

    const user = new UserEntity();
    user.id = uuidv4();
    user.username = profile.username;
    user.email = profile.email || '';
    user.provider = profile.provider;
    user.providerId = profile.providerId || '';
    await this.usersRepository.save(user);
    return user.toJSON() as UserPayload;
  }

  async login(user: UserPayload): Promise<{ accessToken: string; user: UserPayload }> {
    const payload = { sub: user.id, username: user.username };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async getProfile(userId: string): Promise<UserPayload | null> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) return null;
    return user.toJSON() as UserPayload;
  }

  async findAllUsers(): Promise<UserPayload[]> {
    const users = await this.usersRepository.find();
    return users.map((u) => u.toJSON() as UserPayload);
  }

  isAdmin(username: string): boolean {
    const adminUsername = process.env.ADMIN_USERNAME;
    return !!adminUsername && username === adminUsername;
  }

  async isGroupAdmin(userId: string): Promise<boolean> {
    const groups = await this.groupsRepository.find();
    for (const group of groups) {
      if (group.userIds.includes(userId) && group.permissions.admin) {
        return true;
      }
    }
    return false;
  }

  async saveUser(userData: UserPayload): Promise<void> {
    const user = new UserEntity();
    user.id = userData.id;
    user.username = userData.username;
    user.email = userData.email || '';
    user.provider = userData.provider;
    user.providerId = userData.providerId || '';
    await this.usersRepository.save(user);
  }
}
