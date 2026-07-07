import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Minimale Layout-Shell (Stub für FND-003): Topbar + Content-Outlet.
 * Sidebar-Navigation, Ressourcen-Topbar und Mobile-Layout folgen mit
 * dem Layout-Ticket (docs/06 §2).
 */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-dvh flex-col">
      <header class="flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <a routerLink="/dashboard" class="font-semibold text-[var(--accent)]">⚙ Foundry</a>
        <nav class="flex gap-3 text-sm text-[var(--text-muted)]">
          <a routerLink="/dashboard" routerLinkActive="text-[var(--primary)]">Dashboard</a>
          <a routerLink="/buildings" routerLinkActive="text-[var(--primary)]">Gebäude</a>
          <a routerLink="/research" routerLinkActive="text-[var(--primary)]">Forschung</a>
          <a routerLink="/market" routerLinkActive="text-[var(--primary)]">Markt</a>
        </nav>
      </header>
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {}
