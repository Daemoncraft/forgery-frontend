import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

/**
 * Layout-Shell: Topbar mit Navigation, Spielername, Coins und Logout.
 * Sidebar/Mobile-Layout folgen mit dem Layout-Ticket (docs/06 §2).
 */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DecimalPipe],
  template: `
    <div class="flex min-h-dvh flex-col">
      <header class="flex flex-wrap items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <a routerLink="/dashboard" class="font-semibold text-[var(--accent)]">⚙ Foundry</a>
        <nav class="flex gap-3 text-sm text-[var(--text-muted)]">
          <a routerLink="/dashboard" routerLinkActive="text-[var(--primary)]">Dashboard</a>
          <a routerLink="/buildings" routerLinkActive="text-[var(--primary)]">Gebäude</a>
        </nav>

        <div class="ml-auto flex items-center gap-4 text-sm">
          @if (auth.currentPlayer(); as player) {
            <span class="tabular-nums text-[var(--accent)]" title="Coins">
              🪙 {{ player.coins | number: '1.0-0' }}
            </span>
            <span class="text-[var(--text)]" title="Level {{ player.level }}">
              {{ auth.playerName() }}
              <span class="text-[var(--text-muted)]">· L{{ player.level }}</span>
            </span>
          }
          <button
            type="button"
            (click)="logout()"
            class="rounded-lg border border-[var(--border)] px-3 py-1 text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Logout
          </button>
        </div>
      </header>
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthStore);

  protected logout(): void {
    void this.auth.logout();
  }
}
