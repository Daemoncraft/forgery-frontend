import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiClient } from '../api/api-client';
import { PlayerProfile } from '../../shared/models/game.models';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse extends TokenPair {
  player: PlayerProfile;
}

const REFRESH_TOKEN_KEY = 'foundry.refreshToken';

/**
 * Zentraler Auth-Zustand: Tokens, aktueller Spieler, Login/Logout/Refresh.
 * Access-Token nur im Speicher; Refresh-Token im localStorage (MVP-Tradeoff,
 * dokumentiert in docs/05-security).
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

  async login(username: string, password: string): Promise<void> {
    this.#loading.set(true);
    try {
      const res = await this.#api.post<LoginResponse>('auth/login', { username, password });
      this.#applySession(res);
    } finally {
      this.#loading.set(false);
    }
  }

  async register(username: string, email: string, password: string): Promise<void> {
    this.#loading.set(true);
    try {
      const res = await this.#api.post<LoginResponse>('auth/register', { username, email, password });
      this.#applySession(res);
    } finally {
      this.#loading.set(false);
    }
  }

  /**
   * App-Start: mit gespeichertem Refresh-Token eine Session wiederherstellen.
   * Wird aus einem APP_INITIALIZER/Bootstrap-Hook aufgerufen.
   */
  async restoreSession(): Promise<void> {
    if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
      const token = await this.refreshAccessToken();
      if (token) {
        this.#currentPlayer.set(await this.#api.get<PlayerProfile>('players/me'));
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

  logout(): void {
    this.#accessToken.set(null);
    this.#currentPlayer.set(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    void this.#router.navigate(['/login']);
  }

  /** Nach Aktionen mit XP-/Level-Änderung vom Server nachziehen. */
  async reloadProfile(): Promise<void> {
    if (!this.isAuthenticated()) return;
    this.#currentPlayer.set(await this.#api.get<PlayerProfile>('players/me'));
  }

  async #doRefresh(): Promise<string | null> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    try {
      const res = await this.#api.post<TokenPair>('auth/refresh', { refreshToken });
      this.#accessToken.set(res.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
      return res.accessToken;
    } catch {
      this.logout();
      return null;
    }
  }

  #applySession(res: LoginResponse): void {
    this.#accessToken.set(res.accessToken);
    this.#currentPlayer.set(res.player);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
  }
}
