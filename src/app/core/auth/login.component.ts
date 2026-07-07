import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, isDevMode, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/** Login mit E-Mail/Username + Passwort gegen POST /api/auth/login. */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="grid min-h-dvh place-items-center p-4">
      <div class="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 class="text-lg font-semibold">⚙ Foundry – Login</h1>

        <form class="mt-4 space-y-3" (ngSubmit)="submit()">
          <label class="block text-sm">
            <span class="text-[var(--text-muted)]">E-Mail oder Username</span>
            <input
              name="usernameOrEmail"
              type="text"
              required
              autocomplete="username"
              [(ngModel)]="usernameOrEmail"
              [disabled]="auth.loading()"
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
              [disabled]="auth.loading()"
              class="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 outline-none focus:border-[var(--primary)]"
            />
          </label>

          @if (error(); as message) {
            <p class="rounded-lg border border-[var(--danger)] px-3 py-2 text-sm text-[var(--danger)]">
              {{ message }}
            </p>
          }

          <button
            type="submit"
            [disabled]="auth.loading() || !usernameOrEmail || !password"
            class="w-full rounded-lg bg-[var(--primary)] px-3 py-2 font-medium text-[var(--bg)] disabled:opacity-50"
          >
            {{ auth.loading() ? 'Anmelden …' : 'Anmelden' }}
          </button>
        </form>

        @if (devMode) {
          <p class="mt-4 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-muted)]">
            Dev-Game-Master: <code>gm&#64;localhost</code> /
            <code>DevOnly123!</code> (Dev-Default, konfigurierbar über
            <code>FOUNDRY_DEV_GM_PASSWORD</code> im Backend)
          </p>
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  protected readonly devMode = isDevMode();
  protected usernameOrEmail = '';
  protected password = '';
  protected readonly error = signal<string | null>(null);

  protected async submit(): Promise<void> {
    if (!this.usernameOrEmail || !this.password) return;
    this.error.set(null);
    try {
      await this.auth.login(this.usernameOrEmail.trim(), this.password);
      const returnUrl = this.#route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
      await this.#router.navigateByUrl(returnUrl);
    } catch (err: unknown) {
      this.error.set(
        err instanceof HttpErrorResponse && err.status === 401
          ? 'Login fehlgeschlagen — E-Mail/Username oder Passwort ist falsch.'
          : 'Server nicht erreichbar — bitte später erneut versuchen.',
      );
    }
  }
}
