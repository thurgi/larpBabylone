import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('documents')
export class DocumentEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column()
  createdAt!: string;

  @Column()
  updatedAt!: string;

  @Column({ type: 'text', default: '[]' })
  groupIdsJson!: string;

  @Column({ type: 'uuid', nullable: true })
  folderId!: string | null;

  get groupIds(): string[] {
    return JSON.parse(this.groupIdsJson || '[]');
  }

  set groupIds(value: string[]) {
    this.groupIdsJson = JSON.stringify(value);
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      groupIds: this.groupIds,
      folderId: this.folderId,
    };
  }
}
