import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { DocumentEntity } from '../../../modules/documents/entities/document.entity';
import { VersionEntity } from '../../../modules/documents/entities/version.entity';
import { FolderEntity } from '../../../modules/documents/entities/folder.entity';
import { ObjectEntity } from '../../../modules/objects/entities/object.entity';
import { GroupEntity } from '../../groups/entities/group.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqljs',
        location: path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'database.sqlite'),
        autoSave: true,
        entities: [DocumentEntity, VersionEntity, FolderEntity, ObjectEntity, GroupEntity, UserEntity],
        synchronize: true,
      }),
    }),
  ],
})
export class SqliteStorageModule {}
