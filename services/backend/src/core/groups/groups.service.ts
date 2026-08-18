import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupEntity } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupsRepository: Repository<GroupEntity>,
  ) {}

  async create(dto: CreateGroupDto): Promise<GroupEntity> {
    const group = new GroupEntity();
    group.id = uuidv4();
    group.name = dto.name;
    group.permissions = dto.permissions;
    group.userIds = dto.userIds || [];
    return this.groupsRepository.save(group);
  }

  async findAll(): Promise<GroupEntity[]> {
    return this.groupsRepository.find();
  }

  async findOne(id: string): Promise<GroupEntity> {
    const group = await this.groupsRepository.findOneBy({ id });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    return group;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupEntity> {
    const group = await this.findOne(id);
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.permissions !== undefined) group.permissions = dto.permissions;
    if (dto.userIds !== undefined) group.userIds = dto.userIds;
    return this.groupsRepository.save(group);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.groupsRepository.delete(id);
  }
}
