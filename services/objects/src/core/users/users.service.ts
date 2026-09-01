import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { GroupEntity } from '../groups/entities/group.entity';
import {
  UserPayload,
  SyncUserProfile,
  isSuperAdmin,
  isGroupAdmin as isGroupAdminForUser,
} from '@larpbabylone/user-module';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupsRepository: Repository<GroupEntity>,
  ) {}

  async findOrCreateLocalUser(profile: SyncUserProfile): Promise<UserPayload | null> {
    let user = await this.usersRepository.findOneBy({ id: profile.id });
    if (user) {
      user.username = profile.username;
      if (profile.email) user.email = profile.email;
      await this.usersRepository.save(user);
      return user.toJSON() as UserPayload;
    }

    user = new UserEntity();
    user.id = profile.id;
    user.username = profile.username;
    user.email = profile.email || '';
    user.provider = profile.provider || 'discord';
    user.providerId = profile.id;
    await this.usersRepository.save(user);
    return user.toJSON() as UserPayload;
  }

  async getProfile(userId: string): Promise<UserPayload | null> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) return null;
    return user.toJSON() as UserPayload;
  }

  async findAllUsers(): Promise<UserPayload[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => user.toJSON() as UserPayload);
  }

  isAdmin(username: string): boolean {
    return isSuperAdmin(username, process.env.ADMIN_USERNAME);
  }

  async isGroupAdmin(userId: string): Promise<boolean> {
    const groups = await this.groupsRepository.find();
    return isGroupAdminForUser(userId, groups);
  }
}
