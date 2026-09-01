import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupEntity } from './entities/group.entity';
import { GroupsController, GroupsAdminGuard } from './groups.controller';
import { GroupsService } from './groups.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GroupEntity]), AuthModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsAdminGuard],
  exports: [GroupsService],
})
export class GroupsModule {}
