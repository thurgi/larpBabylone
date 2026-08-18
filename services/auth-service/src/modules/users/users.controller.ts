import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserPayload } from '@larpbabylone/user-module';

/**
 * Endpoints internes pour la consultation des utilisateurs.
 * À protéger via network policy en production (appels microservices uniquement).
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<UserPayload[]> {
    return this.usersService.findAllUsers();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserPayload> {
    const user = await this.usersService.getProfile(id);
    if (!user) throw new NotFoundException(`Utilisateur ${id} introuvable`);
    return user;
  }
}
