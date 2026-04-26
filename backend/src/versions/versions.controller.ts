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
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VersionsService } from './versions.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermission } from '../permissions/permissions.guard';
import { Request } from 'express';

@Controller('documents/:documentId/versions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  @RequirePermission('versions', 'read')
  findAll(@Param('documentId', new ParseUUIDPipe()) documentId: string) {
    return this.versionsService.findAll(documentId);
  }

  @Post()
  @HttpCode(201)
  @RequirePermission('versions', 'create')
  create(
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body() dto: CreateVersionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.versionsService.create(documentId, dto, user.id);
  }

  @Get(':versionId')
  @RequirePermission('versions', 'read')
  findOne(
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
  ) {
    return this.versionsService.findOne(documentId, versionId);
  }

  @Put(':versionId')
  @RequirePermission('versions', 'update')
  update(
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body() dto: UpdateVersionDto,
  ) {
    return this.versionsService.update(documentId, versionId, dto);
  }

  @Delete(':versionId')
  @HttpCode(204)
  @RequirePermission('versions', 'delete')
  remove(
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
  ) {
    return this.versionsService.remove(documentId, versionId);
  }

  @Patch(':versionId/validate')
  @RequirePermission('versions', 'update')
  validate(
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
  ) {
    return this.versionsService.validate(documentId, versionId);
  }
}
