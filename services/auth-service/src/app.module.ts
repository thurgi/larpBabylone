import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './core/auth/auth.module';
import { AssociationsModule } from './modules/associations/associations.module';
import { UsersModule } from './modules/users/users.module';
import { UserEntity } from './modules/users/entities/user.entity';
import { AssociationEntity } from './modules/associations/entities/association.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqljs' as any,
        autoSave: true,
        location: process.env.AUTH_DATA_DIR
          ? `${process.env.AUTH_DATA_DIR}/auth.sqlite`
          : ':memory:',
        entities: [UserEntity, AssociationEntity],
        synchronize: true,
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    AuthModule,
    AssociationsModule,
    UsersModule,
  ],
})
export class AppModule {}
