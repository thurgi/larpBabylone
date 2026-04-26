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
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermission } from '../permissions/permissions.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @RequirePermission('documents', 'read')
  findAll() {
    return this.documentsService.findAll();
  }

  @Post()
  @HttpCode(201)
  @RequirePermission('documents', 'create')
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get(':documentId')
  @RequirePermission('documents', 'read')
  findOne(@Param('documentId', new ParseUUIDPipe()) documentId: string) {
    return this.documentsService.findOne(documentId);
  }

  @Put(':documentId')
  @RequirePermission('documents', 'update')
  update(
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(documentId, dto);
  }

  @Delete(':documentId')
  @HttpCode(204)
  @RequirePermission('documents', 'delete')
  remove(@Param('documentId', new ParseUUIDPipe()) documentId: string) {
    return this.documentsService.remove(documentId);
  }
}
