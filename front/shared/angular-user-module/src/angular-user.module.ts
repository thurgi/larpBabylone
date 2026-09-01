import { ModuleWithProviders, NgModule } from '@angular/core';
import { AngularAuthenticationService } from './services/angular-authentication.service';
import { AngularAuthorizationService } from './services/angular-authorization.service';
import { ANGULAR_USER_MODULE_OPTIONS } from './types/angular-user-module.tokens';
import { AngularUserModuleOptions } from './types/angular-user-module.types';

@NgModule({})
export class AngularUserModule {
  static forRoot(options: AngularUserModuleOptions): ModuleWithProviders<AngularUserModule> {
    return {
      ngModule: AngularUserModule,
      providers: [
        { provide: ANGULAR_USER_MODULE_OPTIONS, useValue: options },
        AngularAuthenticationService,
        AngularAuthorizationService,
      ],
    };
  }
}
