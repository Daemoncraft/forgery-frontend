import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Stub (FND-003): echtes Registrierungs-Formular folgt mit dem Auth-UI-Ticket. */
@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="grid min-h-dvh place-items-center p-4">
      <div class="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <h1 class="text-lg font-semibold">Foundry – Registrierung</h1>
        <p class="mt-2 text-sm text-[var(--text-muted)]">
          Registrierungs-Formular in Arbeit.
          Zurück zum <a routerLink="/login" class="text-[var(--primary)]">Login</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {}
