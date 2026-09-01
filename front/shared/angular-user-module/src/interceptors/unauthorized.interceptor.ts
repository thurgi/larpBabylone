import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AngularAuthenticationService } from '../services/angular-authentication.service';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AngularAuthenticationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        window.location.href = authService.buildLoginUrl(window.location.pathname);
      }
      return throwError(() => error);
    }),
  );
};
