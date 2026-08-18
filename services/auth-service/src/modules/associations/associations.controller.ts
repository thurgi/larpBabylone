import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Req, ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { AssociationsService } from './associations.service';
import { CreateAssociationDto, UpdateAssociationDto } from './dto/association.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { AuthService } from '../../core/auth/auth.service';
import { UserPayload } from '@larpbabylone/user-module';
import { Request } from 'express';

@Controller('associations')
export class AssociationsController {
  constructor(
    private readonly associationsService: AssociationsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  findAll() {
    return this.associationsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.associationsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: Request, @Body() dto: CreateAssociationDto) {
    this.requireSuperAdmin(req);
    return this.associationsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateAssociationDto) {
    this.requireSuperAdmin(req);
    return this.associationsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(@Req() req: Request, @Param('id') id: string) {
    this.requireSuperAdmin(req);
    return this.associationsService.remove(id);
  }

  private requireSuperAdmin(req: Request): void {
    const user = req.user as UserPayload;
    if (!this.authService.isSuperAdmin(user.username)) {
      throw new ForbiddenException('Réservé au super-admin');
    }
  }
}
