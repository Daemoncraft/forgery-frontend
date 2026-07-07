import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Gemeinsames Auth-Layout (Login/Registrierung): zentrierte Card, Titel,
 * Untertitel — schlicht, responsive, dark-mode-fähig über die Design-Tokens,
 * ohne Spielgrafik und später leicht brandbar (ein Ort für Logo/Name).
 */
@Component({
  selector: 'app-auth-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid min-h-dvh place-items-center p-4">
      <div class="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 class="text-lg font-semibold">
          <span class="text-[var(--accent)]">⚙</span> Forgery
        </h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">{{ subtitle() }}</p>
        <div class="mt-4">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class AuthCardComponent {
  readonly subtitle = input.required<string>();
}
