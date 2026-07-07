import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiClient } from '../api/api-client';
import { PlayerProfile, TokenResponse } from '../../shared/models/game.models';

const REFRESH_TOKEN_KEY = 'foundry.refreshToken';

/**
 * Zentraler Auth-Zustand: Tokens, aktueller Spieler, Login/Logout/Refresh.
 * Access-Token nur im Speicher; Refresh-Token im localStorage (MVP-Tradeoff).
 * API-Vertrag: POST /api/auth/login|refresh|logout, GET /api/auth/me.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly #api = inject(ApiClient);
  readonly #router = inject(Router);

  readonly #accessToken = signal<string | null>(null);
  readonly #currentPlayer = signal<PlayerProfile | null>(null);
  readonly #loading = signal(false);

  /** Single-Flight: parallele 401s teilen sich einen Refresh-Vorgang. */
  #refreshInFlight: Promise<string | null> | null = null;

  readonly accessToken = this.#accessToken.asReadonly();
  readonly currentPlayer = this.#currentPlayer.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly isAuthenticated = computed(() => this.#accessToken() !== null);
  readonly isAdmin = computed(() => this.#currentPlayer()?.roles.includes('ADMIN') ?? false);
  /** Anzeigename: displayName, sonst username. */
  readonly playerName = computed(() => {
    const player = this.#currentPlayer();
    return player?.displayName ?? player?.username ?? '';
  });

  async login(usernameOrEmail: string, password: string): Promise<void> {
    this.#loading.set(true);
    try {
      const res = await this.#api.post<TokenResponse>('auth/login', { usernameOrEmail, password });
      this.#applyTokens(res);
      this.#currentPlayer.set(await this.#api.get<PlayerProfile>('auth/me'));
    } finally {
      this.#loading.set(false);
    }
  }

  /**
   * App-Start: mit gespeichertem Refresh-Token eine Session wiederherstellen.
   * Wird vom App-Initializer (app.config.ts) aufgerufen.
   */
  async restoreSession(): Promise<void> {
    if (!localStorage.getItem(REFRESH_TOKEN_KEY)) return;
    const token = await this.refreshAccessToken();
    if (token) {
      try {
        this.#currentPlayer.set(await this.#api.get<PlayerProfile>('auth/me'));
      } catch {
        // /me fehlgeschlagen → Session gilt als nicht wiederhergestellt
        this.#accessToken.set(null);
      }
    }
  }

  /**
   * Tauscht das Refresh-Token gegen ein neues Token-Paar (Single-Flight).
   * Liefert das neue Access-Token oder null (→ Aufrufer leitet zum Login).
   */
  refreshAccessToken(): Promise<string | null> {
    this.#refreshInFlight ??= this.#doRefresh().finally(() => {
      this.#refreshInFlight = null;
    });
    return this.#refreshInFlight;
  }

  /** Widerruft das Refresh-Token serverseitig und verwirft den lokalen Zustand. */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      // Best effort — Logout darf an Netzwerkfehlern nicht scheitern
      try {
        await this.#api.post('auth/logout', { refreshToken });
      } catch {
        /* ignoriert */
      }
    }
    this.#clearSession();
  }

  /** Nach Aktionen mit Coins-/XP-Änderung vom Server nachziehen. */
  async reloadProfile(): Promise<void> {
    if (!this.isAuthenticated()) return;
    this.#currentPlayer.set(await this.#api.get<PlayerProfile>('auth/me'));
  }

  async #doRefresh(): Promise<string | null> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    try {
      const res = await this.#api.post<TokenResponse>('auth/refresh', { refreshToken });
      this.#applyTokens(res);
      return res.accessToken;
    } catch {
      this.#clearSession();
      return null;
    }
  }

  #applyTokens(res: TokenResponse): void {
    this.#accessToken.set(res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
  }

  #clearSession(): void {
    this.#accessToken.set(null);
    this.#currentPlayer.set(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    void this.#router.navigate(['/login']);
  }
}
