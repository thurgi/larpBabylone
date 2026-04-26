import { Module } from '@nestjs/common';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionsGuard } from '../permissions/permissions.guard';

@Module({
  imports: [AuthModule],
  controllers: [VersionsController],
  providers: [VersionsService, PermissionsGuard],
  exports: [VersionsService],
})
export class VersionsModule {}
