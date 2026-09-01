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
  Inject,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AUTHORIZATION_SERVICE } from '@larpbabylone/nest-user-module';
import { AuthenticatedUser, AuthorizationService } from '@larpbabylone/user-module';

@Injectable()
export class GroupsAdminGuard implements CanActivate {
  constructor(
    @Inject(AUTHORIZATION_SERVICE)
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    if (!user) {
      throw new ForbiddenException();
    }
    if (this.authorizationService.isSuperAdmin(user)) {
      return true;
    }
    const isGroupAdmin = this.authorizationService.hasAnyRole(user, ['group-admin', 'groups-admin']);
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
