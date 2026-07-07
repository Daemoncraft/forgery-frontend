import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

/**
 * /api-Requests: immer `withCredentials` (Refresh-Cookie, Path=/api/auth) und
 * `X-Requested-With` (CSRF-Nachweis der Cookie-Endpoints, docs/08 §2.3).
 * Bearer-Token an alles außer den Token-Endpoints selbst; bei 401 einmaliger
 * Single-Flight-Refresh + Retry. Schlägt der Refresh fehl, räumt der
 * AuthStore auf und der Guard leitet zum Login.
 */
const TOKEN_FREE_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);

  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const base = req.clone({
    withCredentials: true,
    setHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
  });

  if (TOKEN_FREE_PATHS.some(path => req.url.startsWith(path))) {
    return next(base);
  }

  return next(withToken(base, auth.accessToken())).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        return from(auth.refreshAccessToken()).pipe(
          switchMap(newToken =>
            newToken ? next(withToken(base, newToken)) : throwError(() => err),
          ),
        );
      }
      return throwError(() => err);
    }),
  );
};

function withToken<T>(req: HttpRequest<T>, token: string | null): HttpRequest<T> {
  return token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
}
