import { Module } from '@nestjs/common';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [AuthModule, DocumentsModule],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
