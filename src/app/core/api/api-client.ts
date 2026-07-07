import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface RequestOptions {
  params?: QueryParams;
  /** z. B. SUPPRESS_ERROR_TOAST für Polling-Requests */
  context?: HttpContext;
}

/**
 * Dünner, typisierter HTTP-Wrapper. Alle API-Services gehen über diesen Client —
 * kein Feature ruft HttpClient direkt auf. Basis-URL: /api (Reverse Proxy / Dev-Proxy).
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = '/api';

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return firstValueFrom(
      this.#http.get<T>(this.#url(path), this.#opts(options)),
    );
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return firstValueFrom(
      this.#http.post<T>(this.#url(path), body ?? {}, this.#opts(options)),
    );
  }

  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return firstValueFrom(
      this.#http.patch<T>(this.#url(path), body, this.#opts(options)),
    );
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return firstValueFrom(
      this.#http.delete<T>(this.#url(path), this.#opts(options)),
    );
  }

  #url(path: string): string {
    return `${this.#baseUrl}/${path.replace(/^\//, '')}`;
  }

  #opts(options?: RequestOptions): { params?: HttpParams; context?: HttpContext } {
    let params: HttpParams | undefined;
    if (options?.params) {
      params = new HttpParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) params = params.set(key, String(value));
      }
    }
    return { params, context: options?.context };
  }
}
