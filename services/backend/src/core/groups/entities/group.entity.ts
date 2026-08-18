import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('groups')
export class GroupEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text' })
  permissionsJson!: string;

  @Column({ type: 'text', default: '[]' })
  userIdsJson!: string;

  get permissions(): {
    documents: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
    versions: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
    groups?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean };
    publicRead?: boolean;
    admin?: boolean;
  } {
    return JSON.parse(this.permissionsJson || '{}');
  }

  set permissions(value: any) {
    this.permissionsJson = JSON.stringify(value);
  }

  get userIds(): string[] {
    return JSON.parse(this.userIdsJson || '[]');
  }

  set userIds(value: string[]) {
    this.userIdsJson = JSON.stringify(value);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      permissions: this.permissions,
      userIds: this.userIds,
    };
  }
}
