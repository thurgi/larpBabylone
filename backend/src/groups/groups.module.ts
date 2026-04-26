import { Module } from '@nestjs/common';
import { GroupsController, GroupsAdminGuard } from './groups.controller';
import { GroupsService } from './groups.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsAdminGuard],
  exports: [GroupsService],
})
export class GroupsModule {}
