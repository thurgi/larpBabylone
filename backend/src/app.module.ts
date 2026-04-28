import { Module } from '@nestjs/common';
import { SqliteStorageModule } from './core/storage/sqlite/sqlite-storage.module';
import { FileStorageModule } from './core/storage/files/file-storage.module';
import { AuthModule } from './core/auth/auth.module';
import { GroupsModule } from './core/groups/groups.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ObjectsModule } from './modules/objects/objects.module';

@Module({
  imports: [SqliteStorageModule, FileStorageModule, AuthModule, GroupsModule, DocumentsModule, ObjectsModule],
})
export class AppModule {}
