import { HttpContext } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ApiClient } from '../../core/api/api-client';
import { SUPPRESS_ERROR_TOAST } from '../../core/interceptors/error.interceptor';
import {
  ConstructionJob,
  EnergyBalance,
  ResearchJob,
  ResourceStock,
} from '../../shared/models/game.models';

/** Dashboard-Aggregat vom Server (GET /api/dashboard). */
interface DashboardDto {
  serverTime: string;
  resources: ResourceStock[];
  energy: EnergyBalance;
  activeConstruction: ConstructionJob | null;
  activeResearch: ResearchJob | null;
}

const POLL_INTERVAL_MS = 30_000; // docs/06 §7: Dashboard 30 s

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  readonly #api = inject(ApiClient);
  readonly #destroyRef = inject(DestroyRef);

  // ── State (private writable) ───────────────────────────────────────────────
  readonly #resources = signal<ResourceStock[]>([]);
  readonly #energyBalance = signal<EnergyBalance | null>(null);
  readonly #activeConstruction = signal<ConstructionJob | null>(null);
  readonly #activeResearch = signal<ResearchJob | null>(null);
  readonly #loading = signal(false);
  readonly #loaded = signal(false);
  /** serverTime − clientTime, für Countdowns (Client-Zeit-Regel, docs/06 §6). */
  readonly #serverOffsetMs = signal(0);

  #pollTimer: ReturnType<typeof setInterval> | null = null;

  // ── Public readonly ────────────────────────────────────────────────────────
  readonly resources = this.#resources.asReadonly();
  readonly energyBalance = this.#energyBalance.asReadonly();
  readonly activeConstruction = this.#activeConstruction.asReadonly();
  readonly activeResearch = this.#activeResearch.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly loaded = this.#loaded.asReadonly();
  readonly serverOffsetMs = this.#serverOffsetMs.asReadonly();

  // ── Derived ────────────────────────────────────────────────────────────────
  /** Lagerbare Ressourcen für das Grid (Energie ist Bilanz, kein Bestand). */
  readonly storableResources = computed(() =>
    this.#resources().filter(r => r.resource !== 'energy'),
  );

  readonly throttled = computed(() => {
    const e = this.#energyBalance();
    return e !== null && e.throttleFactor < 1;
  });

  readonly nearCapacity = computed(() =>
    this.storableResources().filter(
      r => r.capacity > 0 && r.amount / r.capacity >= 0.9,
    ),
  );

  // ── Actions ────────────────────────────────────────────────────────────────
  async refresh(options: { silent?: boolean } = {}): Promise<void> {
    if (!options.silent) this.#loading.set(true);
    try {
      const dto = await this.#api.get<DashboardDto>('dashboard', {
        // Polling-Fehler nicht als Toast eskalieren
        context: new HttpContext().set(SUPPRESS_ERROR_TOAST, options.silent ?? false),
      });
      this.#resources.set(dto.resources);
      this.#energyBalance.set(dto.energy);
      this.#activeConstruction.set(dto.activeConstruction);
      this.#activeResearch.set(dto.activeResearch);
      this.#serverOffsetMs.set(Date.parse(dto.serverTime) - Date.now());
      this.#loaded.set(true);
    } finally {
      this.#loading.set(false);
    }
  }

  /** Startet Polling (30 s); pausiert bei verstecktem Tab. Idempotent. */
  startPolling(): void {
    if (this.#pollTimer !== null) return;
    void this.refresh();
    this.#pollTimer = setInterval(() => {
      if (!document.hidden) void this.refresh({ silent: true });
    }, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', this.#onVisibility);
    this.#destroyRef.onDestroy(() => this.stopPolling());
  }

  stopPolling(): void {
    if (this.#pollTimer !== null) {
      clearInterval(this.#pollTimer);
      this.#pollTimer = null;
    }
    document.removeEventListener('visibilitychange', this.#onVisibility);
  }

  /** Sofort-Refresh bei Rückkehr in den Tab. */
  readonly #onVisibility = (): void => {
    if (!document.hidden) void this.refresh({ silent: true });
  };
}
