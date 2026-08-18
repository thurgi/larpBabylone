import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('associations')
export class AssociationEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 255, unique: true })
  slug!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 500, nullable: true })
  description!: string;

  @Column({ length: 255 })
  subdomain!: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      description: this.description,
      subdomain: this.subdomain,
      active: this.active,
      createdAt: this.createdAt,
    };
  }
}
