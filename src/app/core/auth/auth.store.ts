import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiClient } from '../api/api-client';
import {
  AuthError,
  PlayerProfile,
  RegisterRequest,
  TokenResponse,
} from '../../shared/models/game.models';

/**
 * Zentraler Auth-Zustand (Signals). Access-Token nur im Memory; das
 * Refresh-Token liegt im httpOnly-Cookie und ist für JS unsichtbar —
 * Session-Restore ist deshalb schlicht ein Refresh-Versuch beim App-Start.
 * API-Vertrag: POST /api/auth/register|login|refresh|logout, GET /api/auth/me.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly #api = inject(ApiClient);
  readonly #router = inject(Router);

  readonly #accessToken = signal<string | null>(null);
  readonly #user = signal<PlayerProfile | null>(null);
  readonly #isLoading = signal(false);
  readonly #error = signal<AuthError | null>(null);

  /** Single-Flight: parallele 401s teilen sich einen Refresh-Vorgang. */
  #refreshInFlight: Promise<string | null> | null = null;

  readonly accessToken = this.#accessToken.asReadonly();
  readonly user = this.#user.asReadonly();
  /** Alias — Bestandscode (Shell/Dashboard) liest currentPlayer. */
  readonly currentPlayer = this.#user.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  /** Alias für Bestandscode. */
  readonly loading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly isAuthenticated = computed(() => this.#accessToken() !== null);
  readonly isAdmin = computed(() => this.#user()?.roles.includes('ADMIN') ?? false);
  readonly playerName = computed(() => {
    const user = this.#user();
    return user?.displayName ?? user?.username ?? '';
  });

  async login(emailOrUsername: string, password: string, rememberMe = false): Promise<void> {
    await this.#run(() =>
      this.#api.post<TokenResponse>('auth/login', { emailOrUsername, password, rememberMe }),
    );
  }

  async register(request: RegisterRequest): Promise<void> {
    await this.#run(() => this.#api.post<TokenResponse>('auth/register', request));
  }

  /**
   * App-Start: Session aus dem httpOnly-Cookie wiederherstellen (App-Initializer).
   * Kein Cookie/abgelaufen → still anonym bleiben.
   */
  async restoreSession(): Promise<void> {
    await this.refreshAccessToken();
  }

  /**
   * Tauscht das Cookie gegen ein neues Token-Paar (Single-Flight).
   * Liefert das neue Access-Token oder null (→ Aufrufer leitet zum Login).
   */
  refreshAccessToken(): Promise<string | null> {
    this.#refreshInFlight ??= this.#doRefresh().finally(() => {
      this.#refreshInFlight = null;
    });
    return this.#refreshInFlight;
  }

  /** Alias gemäß Store-API-Plan. */
  refresh(): Promise<string | null> {
    return this.refreshAccessToken();
  }

  /** Widerruft das Refresh-Token serverseitig, löscht Cookie + lokalen Zustand. */
  async logout(): Promise<void> {
    // Best effort — Logout darf an Netzwerkfehlern nicht scheitern
    try {
      await this.#api.post('auth/logout');
    } catch {
      /* ignoriert */
    }
    this.clearSession();
    void this.#router.navigate(['/login']);
  }

  /** Nach Aktionen mit Coins-/XP-Änderung vom Server nachziehen. */
  async loadMe(): Promise<void> {
    if (!this.isAuthenticated()) return;
    this.#user.set(await this.#api.get<PlayerProfile>('auth/me'));
  }

  /** Alias für Bestandscode (Dashboard/Buildings-Stores). */
  reloadProfile(): Promise<void> {
    return this.loadMe();
  }

  /** Verwirft nur den lokalen Zustand (Refresh fehlgeschlagen, 401-Kaskade). */
  clearSession(): void {
    this.#accessToken.set(null);
    this.#user.set(null);
  }

  async #run(request: () => Promise<TokenResponse>): Promise<void> {
    this.#isLoading.set(true);
    this.#error.set(null);
    try {
      this.#applySession(await request());
    } catch (err: unknown) {
      this.#error.set(toAuthError(err));
      throw err;
    } finally {
      this.#isLoading.set(false);
    }
  }

  async #doRefresh(): Promise<string | null> {
    try {
      const res = await this.#api.post<TokenResponse>('auth/refresh');
      this.#applySession(res);
      return res.accessToken;
    } catch {
      this.clearSession();
      return null;
    }
  }

  #applySession(res: TokenResponse): void {
    this.#accessToken.set(res.accessToken);
    this.#user.set(res.user);
  }
}

/** Mappt RFC-7807 Problem Details auf anzeigbare Formularfehler. */
export function toAuthError(err: unknown): AuthError {
  if (!(err instanceof HttpErrorResponse)) {
    return { message: 'Unerwarteter Fehler.', fieldErrors: {} };
  }
  if (err.status === 0) {
    return { message: 'Server nicht erreichbar — bitte später erneut versuchen.', fieldErrors: {} };
  }
  const problem = (err.error ?? {}) as {
    detail?: string;
    code?: string;
    errors?: { field: string; message: string }[];
  };
  const fieldErrors: Record<string, string> = {};
  for (const fieldError of problem.errors ?? []) {
    fieldErrors[fieldError.field] = fieldError.message;
  }
  switch (problem.code) {
    case 'EMAIL_TAKEN':
      fieldErrors['email'] = 'Diese E-Mail-Adresse ist bereits registriert.';
      break;
    case 'USERNAME_TAKEN':
      fieldErrors['username'] = 'Dieser Username ist bereits vergeben.';
      break;
    case 'PASSWORD_TOO_WEAK':
      fieldErrors['password'] = problem.detail ?? 'Passwort zu schwach.';
      break;
    case 'TERMS_NOT_ACCEPTED':
      fieldErrors['acceptedTerms'] = 'Bitte akzeptiere die Nutzungsbedingungen.';
      break;
  }
  const message =
    err.status === 401
      ? 'Login fehlgeschlagen — E-Mail/Username oder Passwort ist falsch.'
      : err.status === 429
        ? 'Zu viele Versuche — bitte warte einen Moment.'
        : (problem.detail ?? 'Anfrage fehlgeschlagen.');
  return { message, code: problem.code, fieldErrors };
}
