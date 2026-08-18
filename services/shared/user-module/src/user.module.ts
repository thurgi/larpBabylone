import { DynamicModule, Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { USER_MODULE_OPTIONS, UserModuleOptions } from './types/user-module.types';

@Module({})
export class UserModule {
  static register(options: UserModuleOptions): DynamicModule {
    return {
      module: UserModule,
      providers: [
        { provide: USER_MODULE_OPTIONS, useValue: options },
        UsersService,
      ],
      exports: [UsersService],
    };
  }
}
