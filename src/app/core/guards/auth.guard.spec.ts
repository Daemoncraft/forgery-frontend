import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthStore } from '../auth/auth.store';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authenticated: boolean;

  beforeEach(() => {
    authenticated = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { isAuthenticated: () => authenticated } },
      ],
    });
  });

  const run = (url = '/dashboard') =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  it('laesst authentifizierte Nutzer passieren', () => {
    authenticated = true;
    expect(run()).toBe(true);
  });

  it('leitet ohne Session auf /login mit returnUrl um', () => {
    const result = run('/buildings');
    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/login?returnUrl=%2Fbuildings');
  });
});
