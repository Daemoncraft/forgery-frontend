import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiClient } from '../../core/api/api-client';
import { AuthStore } from '../../core/auth/auth.store';
import {
  BuildingActionResponse,
  BuildingCatalogEntry,
  BuildingCatalogResponse,
  BuildingCost,
  InventoryResponse,
  MyBuildingsResponse,
  PlayerBuilding,
} from '../../shared/models/game.models';

/**
 * Gebäude-Zustand: Katalog + eigene Instanzen + Bau/Upgrade-Aktionen.
 * Erschwinglichkeit wird nur für den Disabled-State vorgeprüft (Coins aus
 * /auth/me, Bestände aus /inventory) — die verbindliche Prüfung und
 * Abbuchung macht ausschließlich der Server.
 */
@Injectable({ providedIn: 'root' })
export class BuildingsStore {
  readonly #api = inject(ApiClient);
  readonly #auth = inject(AuthStore);

  readonly #catalog = signal<BuildingCatalogEntry[]>([]);
  readonly #mine = signal<MyBuildingsResponse | null>(null);
  readonly #stocks = signal<Map<string, number>>(new Map());
  readonly #loading = signal(false);
  readonly #loaded = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #actionError = signal<string | null>(null);
  readonly #pendingAction = signal<string | null>(null);

  readonly catalog = this.#catalog.asReadonly();
  readonly mine = this.#mine.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly loaded = this.#loaded.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly actionError = this.#actionError.asReadonly();
  /** Gebäude-Code bzw. Instanz-ID der laufenden Aktion (Button-Spinner). */
  readonly pendingAction = this.#pendingAction.asReadonly();

  readonly constructionActive = computed(() => this.#mine()?.constructionActive ?? false);
  readonly buildableCatalog = computed(() =>
    this.#catalog().filter(entry => !entry.singleton || !this.#ownsBuilding(entry.code)),
  );

  async refresh(): Promise<void> {
    this.#loading.set(true);
    this.#error.set(null);
    try {
      // /buildings/me settlet serverseitig (verbucht fällige Fertigstellungen)
      const mine = await this.#api.get<MyBuildingsResponse>('buildings/me');
      const catalog = await this.#api.get<BuildingCatalogResponse>('buildings/catalog');
      const inventory = await this.#api.get<InventoryResponse>('inventory');
      this.#mine.set(mine);
      this.#catalog.set(catalog.buildings);
      this.#stocks.set(new Map(inventory.resources.map(r => [r.code, r.available])));
      this.#loaded.set(true);
    } catch {
      this.#error.set('Gebäudedaten konnten nicht geladen werden.');
    } finally {
      this.#loading.set(false);
    }
  }

  async build(code: string): Promise<void> {
    await this.#runAction(code, () =>
      this.#api.post<BuildingActionResponse>('buildings/build', { buildingCode: code }),
    );
  }

  async upgrade(building: PlayerBuilding): Promise<void> {
    await this.#runAction(building.id, () =>
      this.#api.post<BuildingActionResponse>(`buildings/${building.id}/upgrade`),
    );
  }

  /** Client-Vorprüfung für den Disabled-State (Server bleibt autoritativ). */
  canAfford(cost: BuildingCost): boolean {
    const coins = this.#auth.currentPlayer()?.coins ?? 0;
    if (coins < cost.coins) return false;
    const stocks = this.#stocks();
    return cost.resources.every(item => (stocks.get(item.code) ?? 0) >= item.amount);
  }

  async #runAction(key: string, action: () => Promise<BuildingActionResponse>): Promise<void> {
    this.#pendingAction.set(key);
    this.#actionError.set(null);
    try {
      await action();
      await this.refresh();
      await this.#auth.reloadProfile(); // Coins in der Topbar nachziehen
    } catch (err: unknown) {
      const problem = err instanceof HttpErrorResponse ? (err.error as { detail?: string }) : null;
      this.#actionError.set(problem?.detail ?? 'Aktion fehlgeschlagen.');
    } finally {
      this.#pendingAction.set(null);
    }
  }

  #ownsBuilding(code: string): boolean {
    return this.#mine()?.buildings.some(b => b.buildingCode === code) ?? false;
  }
}
