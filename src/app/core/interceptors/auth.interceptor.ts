import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

/**
 * Hängt das Access-Token an alle /api-Requests (außer /api/auth/*).
 * Bei 401: einmaliger Refresh-Flow, dann Retry des Original-Requests.
 * Schlägt der Refresh fehl, übernimmt AuthStore.logout() (Redirect /login).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);

  if (!req.url.startsWith('/api') || req.url.startsWith('/api/auth/')) {
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
