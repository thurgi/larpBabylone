import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  username!: string;

  @Column({ length: 255, nullable: true })
  email!: string;

  @Column({ length: 50 })
  provider!: 'discord' | 'google';

  @Column({ length: 255, nullable: true })
  providerId!: string;

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      provider: this.provider,
      providerId: this.providerId,
    };
  }
}
