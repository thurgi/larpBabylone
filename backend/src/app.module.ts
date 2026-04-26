import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { VersionsModule } from './versions/versions.module';
import { GroupsModule } from './groups/groups.module';
import { FoldersModule } from './folders/folders.module';

@Module({
  imports: [StorageModule, AuthModule, DocumentsModule, VersionsModule, GroupsModule, FoldersModule],
})
export class AppModule {}
