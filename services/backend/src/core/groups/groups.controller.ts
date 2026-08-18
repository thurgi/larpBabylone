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
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UserPayload } from '@larpbabylone/user-module';

@Injectable()
export class GroupsAdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: UserPayload = request.user;
    if (!user) {
      throw new ForbiddenException();
    }
    if (this.usersService.isAdmin(user.username)) {
      return true;
    }
    const isGroupAdmin = await this.usersService.isGroupAdmin(user.id);
    if (isGroupAdmin) {
      return true;
    }
    throw new ForbiddenException('Accès réservé aux administrateurs');
  }
}

@Controller('groups')
@UseGuards(JwtAuthGuard, GroupsAdminGuard)
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
