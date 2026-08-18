import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from './entities/user.entity';
import { UserPayload, AuthenticatedProfile } from '@larpbabylone/user-module';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findOrCreateUser(profile: AuthenticatedProfile): Promise<UserPayload> {
    const existing = await this.usersRepository.findOne({
      where: { provider: profile.provider, providerId: profile.providerId },
    });
    if (existing) return existing.toJSON() as UserPayload;

    const user = new UserEntity();
    user.id = uuidv4();
    user.username = profile.username;
    user.email = profile.email || '';
    user.provider = profile.provider;
    user.providerId = profile.providerId;
    await this.usersRepository.save(user);
    return user.toJSON() as UserPayload;
  }

  async getProfile(userId: string): Promise<UserPayload | null> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    return user ? (user.toJSON() as UserPayload) : null;
  }

  async findAllUsers(): Promise<UserPayload[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => user.toJSON() as UserPayload);
  }
}
