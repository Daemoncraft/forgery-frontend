import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { BuildingCost, PlayerBuilding } from '../../shared/models/game.models';
import { BuildingsStore } from './buildings.store';

@Component({
  selector: 'app-buildings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-semibold">Gebäude</h1>
        @if (store.mine(); as mine) {
          <span class="text-sm text-[var(--text-muted)]">
            Bauplätze: {{ mine.buildingSlots.used }}/{{ mine.buildingSlots.total }}
            @if (mine.constructionActive) {
              <span class="ml-2 text-[var(--warning)]">· 🏗 Bau läuft</span>
            }
          </span>
        }
      </div>

      @if (store.actionError(); as message) {
        <div class="rounded-xl border border-[var(--danger)] p-3 text-sm text-[var(--danger)]">
          {{ message }}
        </div>
      }

      @if (store.error(); as message) {
        <div class="rounded-xl border border-[var(--danger)] p-4 text-sm text-[var(--danger)]">
          {{ message }}
          <button type="button" class="ml-2 underline" (click)="refresh()">Erneut versuchen</button>
        </div>
      } @else if (store.loading() && !store.loaded()) {
        <div class="grid gap-3 md:grid-cols-2">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="h-28 animate-pulse rounded-xl bg-[var(--surface-2)]"></div>
          }
        </div>
      } @else {
        <!-- ── Eigene Gebäude ─────────────────────────────────────────── -->
        <section>
          <h2 class="mb-2 text-sm font-medium text-[var(--text-muted)]">Meine Gebäude</h2>
          @if ((store.mine()?.buildings ?? []).length === 0) {
            <div class="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-[var(--text-muted)]">
              Noch keine Gebäude — unten das erste bauen.
            </div>
          } @else {
            <div class="grid gap-3 md:grid-cols-2">
              @for (building of store.mine()!.buildings; track building.id) {
                <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-medium">{{ name(building.buildingCode) }}</span>
                      <span class="ml-2 text-sm text-[var(--text-muted)]">Level {{ building.level }}</span>
                    </div>
                    @switch (building.status) {
                      @case ('ACTIVE') {
                        <span class="text-xs text-[var(--success)]">aktiv</span>
                      }
                      @case ('UPGRADING') {
                        <span class="text-xs text-[var(--warning)]">
                          ⏱ Upgrade auf L{{ building.construction?.targetLevel }}
                        </span>
                      }
                      @case ('UNDER_CONSTRUCTION') {
                        <span class="text-xs text-[var(--warning)]">⏱ im Bau</span>
                      }
                    }
                  </div>

                  @if (building.activeRecipeCode; as recipe) {
                    <p class="mt-1 text-xs text-[var(--text-muted)]">Rezept: {{ recipe }}</p>
                  }

                  @if (building.nextUpgrade; as nextUpgrade) {
                    <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span class="text-sm text-[var(--text-muted)]">
                        L{{ nextUpgrade.targetLevel }}: {{ costLabel(nextUpgrade.cost) }}
                        · {{ nextUpgrade.timeSeconds }}s
                      </span>
                      <button
                        type="button"
                        (click)="upgrade(building)"
                        [disabled]="upgradeDisabled(building)"
                        class="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--bg)] disabled:opacity-40"
                      >
                        {{ store.pendingAction() === building.id ? '…' : '⬆ Upgrade' }}
                      </button>
                    </div>
                    @if (!store.canAfford(nextUpgrade.cost)) {
                      <p class="mt-1 text-xs text-[var(--danger)]">Nicht genug Ressourcen/Coins.</p>
                    }
                  }
                </div>
              }
            </div>
          }
        </section>

        <!-- ── Katalog ────────────────────────────────────────────────── -->
        <section>
          <h2 class="mb-2 text-sm font-medium text-[var(--text-muted)]">Verfügbare Gebäude</h2>
          <div class="grid gap-3 md:grid-cols-2">
            @for (entry of store.buildableCatalog(); track entry.code) {
              <div
                class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                [class.opacity-60]="entry.locked"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ entry.name }}</span>
                  <span class="text-xs text-[var(--text-muted)]">{{ entry.category }}</span>
                </div>
                <p class="mt-1 text-xs text-[var(--text-muted)]">{{ entry.description }}</p>
                <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span class="text-sm text-[var(--text-muted)]">
                    {{ costLabel(entry.baseCost) }} · {{ entry.baseTimeSeconds }}s
                  </span>
                  @if (entry.locked) {
                    <span class="text-xs text-[var(--warning)]">
                      🔒 benötigt {{ entry.requiredTechnologyCode }}
                    </span>
                  } @else {
                    <button
                      type="button"
                      (click)="build(entry.code)"
                      [disabled]="buildDisabled(entry.code, entry.baseCost)"
                      class="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--bg)] disabled:opacity-40"
                    >
                      {{ store.pendingAction() === entry.code ? '…' : '🏗 Bauen' }}
                    </button>
                  }
                </div>
                @if (!entry.locked && !store.canAfford(entry.baseCost)) {
                  <p class="mt-1 text-xs text-[var(--danger)]">Nicht genug Ressourcen/Coins.</p>
                }
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class BuildingsComponent implements OnInit {
  protected readonly store = inject(BuildingsStore);

  ngOnInit(): void {
    void this.store.refresh();
  }

  protected refresh(): void {
    void this.store.refresh();
  }

  protected build(code: string): void {
    void this.store.build(code);
  }

  protected upgrade(building: PlayerBuilding): void {
    void this.store.upgrade(building);
  }

  protected buildDisabled(code: string, cost: BuildingCost): boolean {
    return (
      this.store.pendingAction() !== null ||
      this.store.constructionActive() ||
      !this.store.canAfford(cost)
    );
  }

  protected upgradeDisabled(building: PlayerBuilding): boolean {
    return (
      this.store.pendingAction() !== null ||
      this.store.constructionActive() ||
      building.status !== 'ACTIVE' ||
      building.nextUpgrade === null ||
      !this.store.canAfford(building.nextUpgrade.cost)
    );
  }

  protected name(code: string): string {
    return this.store.catalog().find(entry => entry.code === code)?.name ?? code;
  }

  protected costLabel(cost: BuildingCost): string {
    const parts = [`${cost.coins} 🪙`];
    for (const item of cost.resources) {
      parts.push(`${item.amount} ${item.code}`);
    }
    return parts.join(' + ');
  }
}
