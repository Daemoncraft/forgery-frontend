import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStore } from '../auth/auth.store';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let accessToken: string | null;
  const refreshAccessToken = vi.fn<() => Promise<string | null>>();

  beforeEach(() => {
    accessToken = null;
    refreshAccessToken.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthStore,
          useValue: {
            accessToken: () => accessToken,
            refreshAccessToken,
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  it('setzt withCredentials, X-Requested-With und Bearer-Token auf /api-Requests', async () => {
    accessToken = 'jwt';
    const pending = firstValueFrom(http.get('/api/inventory'));
    const req = backend.expectOne('/api/inventory');

    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt');
    req.flush({});
    await pending;
  });

  it('haengt kein Bearer-Token an die Token-Endpoints selbst', async () => {
    accessToken = 'jwt';
    const pending = firstValueFrom(http.post('/api/auth/refresh', {}));
    const req = backend.expectOne('/api/auth/refresh');

    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
    await pending;
  });

  it('401 → Refresh → Retry mit neuem Token', async () => {
    accessToken = 'alt';
    refreshAccessToken.mockResolvedValue('neu');

    const pending = firstValueFrom(http.get('/api/inventory'));
    backend.expectOne('/api/inventory').flush({}, { status: 401, statusText: 'Unauthorized' });

    // Microtask-Queue leeren, damit der Refresh-Promise-Zweig den Retry anlegt
    await new Promise(resolve => setTimeout(resolve));
    const retry = backend.expectOne('/api/inventory');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer neu');
    retry.flush({ ok: true });

    await expect(pending).resolves.toEqual({ ok: true });
    expect(refreshAccessToken).toHaveBeenCalledOnce();
  });

  it('401 ohne erfolgreichen Refresh propagiert den Fehler', async () => {
    accessToken = 'alt';
    refreshAccessToken.mockResolvedValue(null);

    const pending = firstValueFrom(http.get('/api/inventory'));
    backend.expectOne('/api/inventory').flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(refreshAccessToken).toHaveBeenCalledOnce();
  });
});
