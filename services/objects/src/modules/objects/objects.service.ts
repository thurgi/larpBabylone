import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectEntity } from './entities/object.entity';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ObjectsService {
  constructor(
    @InjectRepository(ObjectEntity)
    private readonly objectsRepository: Repository<ObjectEntity>,
  ) {}

  async create(dto: CreateObjectDto): Promise<ObjectEntity> {
    const obj = new ObjectEntity();
    obj.id = uuidv4();
    obj.name = dto.name;
    obj.description = dto.description;
    return this.objectsRepository.save(obj);
  }

  async findAll(): Promise<ObjectEntity[]> {
    return this.objectsRepository.find();
  }

  async findOne(id: string): Promise<ObjectEntity> {
    const obj = await this.objectsRepository.findOneBy({ id });
    if (!obj) {
      throw new NotFoundException('Objet introuvable');
    }
    return obj;
  }

  async update(id: string, dto: UpdateObjectDto): Promise<ObjectEntity> {
    const obj = await this.findOne(id);
    if (dto.name !== undefined) obj.name = dto.name;
    if (dto.description !== undefined) obj.description = dto.description;
    return this.objectsRepository.save(obj);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.objectsRepository.delete(id);
  }
}
