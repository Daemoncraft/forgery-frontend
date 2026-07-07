import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Routes } from '@angular/router';

/** Stub (FND-003): Platzhalter, bis das Rangliste-Feature umgesetzt wird. */
@Component({
  selector: 'app-leaderboard-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-6xl p-4 lg:p-6">
      <h1 class="text-xl font-semibold">Rangliste</h1>
      <p class="mt-2 text-sm text-[var(--text-muted)]">Dieses Feature ist in Arbeit.</p>
    </div>
  `,
})
export class LeaderboardPlaceholderComponent {}

export const LEADERBOARD_ROUTES: Routes = [
  { path: '', component: LeaderboardPlaceholderComponent },
];
