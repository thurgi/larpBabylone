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
import { ObjectsService } from './objects.service';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';

@Controller('objects')
@UseGuards(JwtAuthGuard)
export class ObjectsController {
  constructor(private readonly objectsService: ObjectsService) {}

  @Get()
  findAll() {
    return this.objectsService.findAll();
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateObjectDto) {
    return this.objectsService.create(dto);
  }

  @Get(':objectId')
  findOne(@Param('objectId', new ParseUUIDPipe()) objectId: string) {
    return this.objectsService.findOne(objectId);
  }

  @Put(':objectId')
  update(
    @Param('objectId', new ParseUUIDPipe()) objectId: string,
    @Body() dto: UpdateObjectDto,
  ) {
    return this.objectsService.update(objectId, dto);
  }

  @Delete(':objectId')
  @HttpCode(204)
  remove(@Param('objectId', new ParseUUIDPipe()) objectId: string) {
    return this.objectsService.remove(objectId);
  }
}
