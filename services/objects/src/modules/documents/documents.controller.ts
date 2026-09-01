import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  ParseUUIDPipe,
  Header,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermission } from '../../core/permissions/permissions.guard';
import { VersionsService } from './versions.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly versionsService: VersionsService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard, PermissionsGuard)
  @RequirePermission('documents', 'read')
  findAll() {
    return this.documentsService.findAll();
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('documents', 'create')
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get(':documentId')
  @UseGuards(OptionalJwtAuthGuard, PermissionsGuard)
  @RequirePermission('documents', 'read')
  findOne(@Param('documentId', new ParseUUIDPipe()) documentId: string) {
    return this.documentsService.findOne(documentId);
  }

  @Get(':documentId/current')
  @UseGuards(OptionalJwtAuthGuard, PermissionsGuard)
  @RequirePermission('versions', 'read')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  getCurrentVersion(@Param('documentId', new ParseUUIDPipe()) documentId: string) {
    return this.versionsService.findCurrentContent(documentId);
  }

  @Put(':documentId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('documents', 'update')
  update(
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(documentId, dto);
  }

  @Delete(':documentId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('documents', 'delete')
  remove(@Param('documentId', new ParseUUIDPipe()) documentId: string) {
    return this.documentsService.remove(documentId);
  }
}
