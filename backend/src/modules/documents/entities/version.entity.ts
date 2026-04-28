import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('versions')
export class VersionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  documentId!: string;

  @Column({ length: 255, nullable: true })
  title!: string;

  @Column({ type: 'boolean', default: false })
  isValid!: boolean;

  @Column()
  createdAt!: string;

  @Column()
  updatedAt!: string;

  @Column('uuid')
  authorId!: string;

  toJSON() {
    return {
      id: this.id,
      documentId: this.documentId,
      title: this.title,
      isValid: this.isValid,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      authorId: this.authorId,
    };
  }
}
