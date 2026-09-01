import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { GroupEntity } from '../groups/entities/group.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, GroupEntity])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
