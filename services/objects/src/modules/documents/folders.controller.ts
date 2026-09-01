import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveDocumentDto } from './dto/move-document.dto';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(
    private readonly foldersService: FoldersService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Get()
  findAll() {
    return this.foldersService.findAll();
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateFolderDto) {
    return this.foldersService.create(dto);
  }

  @Get(':folderId')
  findOne(@Param('folderId', new ParseUUIDPipe()) folderId: string) {
    return this.foldersService.findOne(folderId);
  }

  @Put(':folderId')
  update(
    @Param('folderId', new ParseUUIDPipe()) folderId: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.foldersService.update(folderId, dto);
  }

  @Delete(':folderId')
  @HttpCode(204)
  remove(@Param('folderId', new ParseUUIDPipe()) folderId: string) {
    return this.foldersService.remove(folderId);
  }

  @Patch('move-document/:documentId')
  async moveDocument(
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body() dto: MoveDocumentDto,
  ) {
    if (dto.folderId) {
      await this.foldersService.findOne(dto.folderId);
    }
    return this.documentsService.update(documentId, { folderId: dto.folderId ?? null });
  }
}
