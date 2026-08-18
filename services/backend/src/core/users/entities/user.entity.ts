import { Entity, PrimaryColumn, Column } from 'typeorm';
import { AuthProvider, UserPayload } from '@larpbabylone/user-module';

@Entity('users')
export class UserEntity implements UserPayload {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  username!: string;

  @Column({ length: 255, nullable: true })
  email!: string;

  @Column({ length: 50 })
  provider!: AuthProvider;

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
