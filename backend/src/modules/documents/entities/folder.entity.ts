import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('folders')
export class FolderEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column()
  createdAt!: string;

  @Column()
  updatedAt!: string;

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      parentId: this.parentId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
