import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuthModule } from '../auth/auth.module';
import { PermissionsGuard } from '../permissions/permissions.guard';

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PermissionsGuard],
  exports: [DocumentsService],
})
export class DocumentsModule {}
