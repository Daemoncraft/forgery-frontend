import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Stub: Registrierung ist nicht Teil des MVP-Loops (Backend-Endpoint folgt). */
@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="grid min-h-dvh place-items-center p-4">
      <div class="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <h1 class="text-lg font-semibold">Foundry – Registrierung</h1>
        <p class="mt-2 text-sm text-[var(--text-muted)]">
          Die Registrierung ist noch nicht verfügbar.
          Zurück zum <a routerLink="/login" class="text-[var(--primary)]">Login</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {}
