import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AngularUserModule, unauthorizedInterceptor } from '@larpbabylone/angular-user-module';
import { routes } from './app.routes';
import { getAngularUserModuleOptions } from './runtime-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([unauthorizedInterceptor])),
    importProvidersFrom(AngularUserModule.forRoot(getAngularUserModuleOptions())),
  ],
};
