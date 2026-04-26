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
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get(':groupId')
  findOne(@Param('groupId', new ParseUUIDPipe()) groupId: string) {
    return this.groupsService.findOne(groupId);
  }

  @Put(':groupId')
  update(
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(groupId, dto);
  }

  @Delete(':groupId')
  @HttpCode(204)
  remove(@Param('groupId', new ParseUUIDPipe()) groupId: string) {
    return this.groupsService.remove(groupId);
  }
}
