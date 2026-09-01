import { InjectionToken } from '@angular/core';
import { AngularUserModuleOptions } from './angular-user-module.types';

export const ANGULAR_USER_MODULE_OPTIONS = new InjectionToken<AngularUserModuleOptions>(
  'ANGULAR_USER_MODULE_OPTIONS',
);
