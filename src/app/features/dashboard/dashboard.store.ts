import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClient } from '../../core/api/api-client';
import { AuthStore } from '../../core/auth/auth.store';
import {
  CollectResponse,
  EnergyBalance,
  InventoryResponse,
  ProductionSummaryResponse,
  ResourceCatalogResponse,
  ResourceDefinition,
  ResourceRate,
  ResourceStock,
} from '../../shared/models/game.models';

/** Anzeigemodell: Bestand + Rate + Kapazität einer Ressource. */
export interface ResourceRow {
  code: string;
  name: string;
  amount: number;
  capacity: number;
  netPerHour: number;
}

/**
 * Dashboard-Zustand aus den echten Backend-Projektionen:
 * GET /api/production/summary (settlet serverseitig) + GET /api/inventory +
 * Ressourcen-Katalog. POST /api/production/collect liefert das Einsammel-Delta.
 * Der Client rechnet nie selbst Bestände hoch — jede Zahl kommt vom Server.
 */
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  readonly #api = inject(ApiClient);
  readonly #auth = inject(AuthStore);

  readonly #stocks = signal<ResourceStock[]>([]);
  readonly #rates = signal<ResourceRate[]>([]);
  readonly #energy = signal<EnergyBalance | null>(null);
  readonly #catalog = signal<ResourceDefinition[]>([]);
  readonly #lastCalculatedAt = signal<string | null>(null);
  readonly #lastCollect = signal<CollectResponse | null>(null);
  readonly #loading = signal(false);
  readonly #collecting = signal(false);
  readonly #loaded = signal(false);
  readonly #error = signal<string | null>(null);

  readonly energy = this.#energy.asReadonly();
  readonly lastCalculatedAt = this.#lastCalculatedAt.asReadonly();
  readonly lastCollect = this.#lastCollect.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly collecting = this.#collecting.asReadonly();
  readonly loaded = this.#loaded.asReadonly();
  readonly error = this.#error.asReadonly();

  /** Bestände + Raten, sortiert nach Katalog-Reihenfolge; Energie ist Bilanz, kein Bestand. */
  readonly resources = computed<ResourceRow[]>(() => {
    const names = new Map(this.#catalog().map(def => [def.code, def.name]));
    const order = new Map(this.#catalog().map((def, index) => [def.code, index]));
    const rates = new Map(this.#rates().map(rate => [rate.code, rate.netPerHour]));
    return this.#stocks()
      .map(stock => ({
        code: stock.code,
        name: names.get(stock.code) ?? stock.code,
        amount: stock.amount,
        capacity: stock.capacity,
        netPerHour: rates.get(stock.code) ?? 0,
      }))
      .sort((a, b) => (order.get(a.code) ?? 99) - (order.get(b.code) ?? 99));
  });

  readonly throttled = computed(() => {
    const energy = this.#energy();
    return energy !== null && energy.throttle < 1;
  });

  /** Erstladung/Refresh: Summary settlet, danach konsistenter Inventarstand. */
  async refresh(): Promise<void> {
    this.#loading.set(true);
    this.#error.set(null);
    try {
      if (this.#catalog().length === 0) {
        const catalog = await this.#api.get<ResourceCatalogResponse>('inventory/resources');
        this.#catalog.set(catalog.resources);
      }
      const summary = await this.#api.get<ProductionSummaryResponse>('production/summary');
      const inventory = await this.#api.get<InventoryResponse>('inventory');
      this.#rates.set(summary.netRatesPerHour);
      this.#energy.set(summary.energy);
      this.#lastCalculatedAt.set(summary.lastCalculatedAt);
      this.#stocks.set(inventory.resources);
      this.#loaded.set(true);
    } catch {
      this.#error.set('Dashboard konnte nicht geladen werden.');
    } finally {
      this.#loading.set(false);
    }
  }

  /** Produktion einsammeln (serverseitiges Settlement) und Anzeige nachziehen. */
  async collect(): Promise<void> {
    this.#collecting.set(true);
    try {
      const delta = await this.#api.post<CollectResponse>('production/collect');
      this.#lastCollect.set(delta);
      await this.refresh();
      await this.#auth.reloadProfile();
    } finally {
      this.#collecting.set(false);
    }
  }
}
