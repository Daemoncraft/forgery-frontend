import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Stub (FND-003): echtes Login-Formular folgt mit dem Auth-UI-Ticket. */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="grid min-h-dvh place-items-center p-4">
      <div class="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <h1 class="text-lg font-semibold">Foundry – Login</h1>
        <p class="mt-2 text-sm text-[var(--text-muted)]">
          Login-Formular in Arbeit.
          Noch kein Konto? <a routerLink="/register" class="text-[var(--primary)]">Registrieren</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {}
