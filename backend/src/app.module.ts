import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { VersionsModule } from './versions/versions.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [StorageModule, AuthModule, DocumentsModule, VersionsModule, GroupsModule],
})
export class AppModule {}
