import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Logs the user out and returns to /login when the API rejects the token.
 * The /api/auth/* routes are excluded: a wrong password is also a 401 there,
 * and it must be shown on the form, not treated as an expired session.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      const isAuthRoute = request.url.startsWith('/api/auth/');

      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthRoute) {
        console.debug('[ErrorInterceptor] Jeton invalide ou expiré, retour à la connexion');
        auth.logout();
        void router.navigateByUrl('/login');
      }

      return throwError(() => error);
    }),
  );
};
