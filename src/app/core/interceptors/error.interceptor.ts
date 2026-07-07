import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

/** Requests (z. B. Polling) können Fehler-Toasts unterdrücken. */
export const SUPPRESS_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/** RFC-7807 Problem Details (Kanon §11). */
interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
}

/**
 * Mappt HTTP-Fehler auf Toasts. 401 wird nicht behandelt — dafür ist der
 * authInterceptor (Refresh-Flow) zuständig.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(MessageService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status !== 401 &&
        !req.context.get(SUPPRESS_ERROR_TOAST)
      ) {
        const problem = (err.error ?? {}) as ProblemDetails;
        const offline = err.status === 0;
        toast.add({
          severity: 'error',
          summary: offline
            ? 'Server nicht erreichbar'
            : problem.title ?? `Fehler ${err.status}`,
          detail: offline
            ? 'Bitte Verbindung prüfen und erneut versuchen.'
            : problem.detail ?? 'Unerwarteter Fehler.',
          life: 6000,
        });
      }
      return throwError(() => err);
    }),
  );
};
