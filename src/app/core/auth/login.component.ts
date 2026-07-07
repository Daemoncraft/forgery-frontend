import { ChangeDetectionStrategy, Component, inject, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthCardComponent } from './auth-card.component';
import { AuthStore } from './auth.store';

/** Login mit E-Mail/Username + Passwort gegen POST /api/auth/login. */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, AuthCardComponent],
  template: `
    <app-auth-card subtitle="Melde dich an, um weiterzubauen.">
      <form class="space-y-3" (ngSubmit)="submit()">
        <label class="block text-sm">
          <span class="text-[var(--text-muted)]">E-Mail oder Username</span>
          <input
            name="emailOrUsername"
            type="text"
            required
            autocomplete="username"
            [(ngModel)]="emailOrUsername"
            [disabled]="auth.isLoading()"
            class="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 outline-none focus:border-[var(--primary)]"
          />
        </label>

        <label class="block text-sm">
          <span class="text-[var(--text-muted)]">Passwort</span>
          <input
            name="password"
            type="password"
            required
            autocomplete="current-password"
            [(ngModel)]="password"
            [disabled]="auth.isLoading()"
            class="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 outline-none focus:border-[var(--primary)]"
          />
        </label>

        <label class="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <input type="checkbox" name="rememberMe" [(ngModel)]="rememberMe" [disabled]="auth.isLoading()" />
          Angemeldet bleiben
        </label>

        @if (auth.error(); as error) {
          <p class="rounded-lg border border-[var(--danger)] px-3 py-2 text-sm text-[var(--danger)]">
            {{ error.message }}
          </p>
        }

        <button
          type="submit"
          [disabled]="auth.isLoading() || !emailOrUsername || !password"
          class="w-full rounded-lg bg-[var(--primary)] px-3 py-2 font-medium text-[var(--bg)] disabled:opacity-50"
        >
          {{ auth.isLoading() ? 'Anmelden …' : 'Anmelden' }}
        </button>
      </form>

      <p class="mt-4 text-sm text-[var(--text-muted)]">
        Noch kein Konto?
        <a routerLink="/register" class="text-[var(--primary)]">Jetzt registrieren</a>
      </p>

      @if (devMode) {
        <p class="mt-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-muted)]">
          Dev-Game-Master: <code>gm&#64;localhost</code> — Passwort siehe
          Backend-README (<code>FOUNDRY_DEV_GM_PASSWORD</code>)
        </p>
      }
    </app-auth-card>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  protected readonly devMode = isDevMode();
  protected emailOrUsername = '';
  protected password = '';
  protected rememberMe = false;

  protected async submit(): Promise<void> {
    if (!this.emailOrUsername || !this.password) return;
    try {
      await this.auth.login(this.emailOrUsername.trim(), this.password, this.rememberMe);
      const returnUrl = this.#route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
      await this.#router.navigateByUrl(returnUrl);
    } catch {
      // Fehler steht im AuthStore.error und wird im Template angezeigt
    }
  }
}
