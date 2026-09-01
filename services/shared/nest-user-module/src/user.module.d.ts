import { DynamicModule } from '@nestjs/common';
import { NestUserModuleOptions } from './types/nest-user-module.types';
export declare class NestUserModule {
    static register(options: NestUserModuleOptions): DynamicModule;
}
