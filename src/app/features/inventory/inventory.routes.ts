import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Routes } from '@angular/router';

/** Stub (FND-003): Platzhalter, bis das Inventar-Feature umgesetzt wird. */
@Component({
  selector: 'app-inventory-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-6xl p-4 lg:p-6">
      <h1 class="text-xl font-semibold">Inventar</h1>
      <p class="mt-2 text-sm text-[var(--text-muted)]">Dieses Feature ist in Arbeit.</p>
    </div>
  `,
})
export class InventoryPlaceholderComponent {}

export const INVENTORY_ROUTES: Routes = [
  { path: '', component: InventoryPlaceholderComponent },
];
