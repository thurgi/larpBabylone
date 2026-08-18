import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './entities/document.entity';
import { VersionEntity } from './entities/version.entity';
import { FolderEntity } from './entities/folder.entity';
import { GroupEntity } from '../../core/groups/entities/group.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { AuthModule } from '../../core/auth/auth.module';
import { PermissionsGuard } from '../../core/permissions/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity, VersionEntity, FolderEntity, GroupEntity]),
    AuthModule,
  ],
  controllers: [DocumentsController, VersionsController, FoldersController],
  providers: [DocumentsService, VersionsService, FoldersService, PermissionsGuard],
  exports: [DocumentsService, VersionsService, FoldersService],
})
export class DocumentsModule {}
