import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlayerProfile } from '../../shared/models/game.models';
import { AuthStore, toAuthError } from './auth.store';
import { HttpErrorResponse } from '@angular/common/http';

const gm: PlayerProfile = {
  userId: 'u-1',
  playerId: 'p-1',
  email: 'gm@localhost',
  username: 'gm',
  displayName: 'Game Master',
  roles: ['PLAYER', 'GAME_MASTER'],
  coins: 600,
  level: 1,
  xp: 0,
  buildingSlots: 8,
};

describe('AuthStore', () => {
  let store: AuthStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  });

  it('login setzt Access-Token und User aus der Response', async () => {
    const pending = store.login('gm', 'DevOnly123!', true);
    const req = http.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ emailOrUsername: 'gm', password: 'DevOnly123!', rememberMe: true });
    req.flush({ accessToken: 'jwt', accessTokenExpiresInSeconds: 900, expiresAt: 'x', user: gm });
    await pending;

    expect(store.isAuthenticated()).toBe(true);
    expect(store.accessToken()).toBe('jwt');
    expect(store.user()?.username).toBe('gm');
    expect(store.error()).toBeNull();
  });

  it('login-Fehler landet als AuthError im Store und wird weitergeworfen', async () => {
    const pending = store.login('gm', 'falsch');
    http.expectOne('/api/auth/login').flush(
      { detail: 'x', code: 'INVALID_CREDENTIALS' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(pending).rejects.toBeTruthy();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.error()?.message).toContain('Login fehlgeschlagen');
  });

  it('register uebernimmt die Session aus der 201-Response', async () => {
    const pending = store.register({
      email: 'anna@example.com',
      username: 'anna',
      password: 'Abcdef123!',
      acceptedTerms: true,
    });
    http.expectOne('/api/auth/register').flush({
      accessToken: 'jwt2',
      accessTokenExpiresInSeconds: 900,
      expiresAt: 'x',
      user: { ...gm, username: 'anna' },
    });
    await pending;

    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()?.username).toBe('anna');
  });

  it('fehlgeschlagener Refresh raeumt die Session auf', async () => {
    const pending = store.refreshAccessToken();
    http.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(await pending).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('parallele Refreshs teilen sich einen Request (Single-Flight)', async () => {
    const first = store.refreshAccessToken();
    const second = store.refreshAccessToken();
    http.expectOne('/api/auth/refresh').flush({
      accessToken: 'jwt3',
      accessTokenExpiresInSeconds: 900,
      expiresAt: 'x',
      user: gm,
    });

    expect(await first).toBe('jwt3');
    expect(await second).toBe('jwt3');
    http.verify();
  });
});

describe('toAuthError', () => {
  const httpError = (status: number, body: unknown) =>
    new HttpErrorResponse({ status, error: body, url: '/api/auth/register' });

  it('mappt Backend-Codes auf Feldfehler', () => {
    expect(toAuthError(httpError(409, { code: 'EMAIL_TAKEN' })).fieldErrors['email']).toBeTruthy();
    expect(toAuthError(httpError(409, { code: 'USERNAME_TAKEN' })).fieldErrors['username']).toBeTruthy();
    expect(
      toAuthError(httpError(422, { code: 'PASSWORD_TOO_WEAK', detail: 'zu schwach' })).fieldErrors['password'],
    ).toBe('zu schwach');
  });

  it('uebernimmt errors[] aus Validierungsfehlern', () => {
    const error = toAuthError(
      httpError(400, { code: 'VALIDATION_FAILED', errors: [{ field: 'username', message: 'ungültig' }] }),
    );
    expect(error.fieldErrors['username']).toBe('ungültig');
  });

  it('liefert generische Meldungen fuer 401 und Netzwerkfehler', () => {
    expect(toAuthError(httpError(401, {})).message).toContain('Login fehlgeschlagen');
    expect(toAuthError(httpError(0, null)).message).toContain('nicht erreichbar');
  });
});
