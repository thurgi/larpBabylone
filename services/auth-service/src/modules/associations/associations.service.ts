import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssociationEntity } from './entities/association.entity';
import { CreateAssociationDto, UpdateAssociationDto } from './dto/association.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AssociationsService {
  constructor(
    @InjectRepository(AssociationEntity)
    private readonly repo: Repository<AssociationEntity>,
  ) {}

  async findAll(): Promise<AssociationEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findBySlug(slug: string): Promise<AssociationEntity | null> {
    return this.repo.findOneBy({ slug });
  }

  async findById(id: string): Promise<AssociationEntity | null> {
    return this.repo.findOneBy({ id });
  }

  async create(dto: CreateAssociationDto): Promise<AssociationEntity> {
    const existing = await this.repo.findOneBy({ slug: dto.slug });
    if (existing) throw new ConflictException(`Le slug "${dto.slug}" est déjà utilisé`);

    const asso = new AssociationEntity();
    asso.id = uuidv4();
    asso.slug = dto.slug;
    asso.name = dto.name;
    asso.description = dto.description || '';
    asso.subdomain = dto.subdomain;
    asso.active = true;
    return this.repo.save(asso);
  }

  async update(id: string, dto: UpdateAssociationDto): Promise<AssociationEntity> {
    const asso = await this.repo.findOneBy({ id });
    if (!asso) throw new NotFoundException(`Association ${id} introuvable`);

    if (dto.name !== undefined) asso.name = dto.name;
    if (dto.description !== undefined) asso.description = dto.description;
    if (dto.subdomain !== undefined) asso.subdomain = dto.subdomain;
    if (dto.active !== undefined) asso.active = dto.active;

    return this.repo.save(asso);
  }

  async remove(id: string): Promise<void> {
    const asso = await this.repo.findOneBy({ id });
    if (!asso) throw new NotFoundException(`Association ${id} introuvable`);
    await this.repo.remove(asso);
  }
}
