import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

/**
 * Hängt das Access-Token an alle /api-Requests. Ausgenommen sind die
 * Token-Endpoints selbst (Login/Refresh/Logout — dort ist das Refresh-Token
 * im Body der Nachweis); /api/auth/me dagegen braucht das Token.
 * Bei 401: einmaliger Refresh-Flow, dann Retry des Original-Requests.
 * Schlägt der Refresh fehl, räumt AuthStore auf (Redirect /login).
 */
const TOKEN_FREE_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);

  if (!req.url.startsWith('/api') || TOKEN_FREE_PATHS.some(path => req.url.startsWith(path))) {
    return next(req);
  }

  return next(withToken(req, auth.accessToken())).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        return from(auth.refreshAccessToken()).pipe(
          switchMap(newToken =>
            newToken ? next(withToken(req, newToken)) : throwError(() => err),
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
