import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { DashboardStore } from './dashboard.store';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CompactNumberPipe, PercentPipe],
  template: `
    <div class="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      <h1 class="text-xl font-semibold text-[var(--text)]">Dashboard</h1>

      @if (store.loading() && !store.loaded()) {
        <!-- Skeleton beim Erstladen -->
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
            <div class="h-24 animate-pulse rounded-xl bg-[var(--surface-2)]"></div>
          }
        </div>
      } @else {
        <!-- ── Energie-Bilanz-Widget ─────────────────────────────────── -->
        @if (store.energyBalance(); as energy) {
          <section
            class="rounded-xl border bg-[var(--surface)] p-4"
            [class]="store.throttled() ? 'border-[var(--warning)]' : 'border-[var(--border)]'"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-[var(--accent)]">⚡</span>
                <span class="font-medium">Energie</span>
                <span class="text-sm text-[var(--text-muted)] tabular-nums">
                  {{ energy.productionPerHour | compactNumber }}/h erzeugt ·
                  {{ energy.demandPerHour | compactNumber }}/h Bedarf
                </span>
              </div>
              <span class="text-sm tabular-nums"
                    [class]="store.throttled() ? 'text-[var(--warning)]' : 'text-[var(--success)]'">
                {{ energy.throttleFactor | percent: '1.0-0' }}
              </span>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div class="h-full rounded-full transition-all"
                   [class]="store.throttled() ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'"
                   [style.width.%]="energy.throttleFactor * 100"></div>
            </div>
            @if (store.throttled()) {
              <p class="mt-2 text-sm text-[var(--warning)]">
                ⚠ Produktion gedrosselt auf
                {{ store.energyBalance()!.throttleFactor | percent: '1.0-0' }} —
                Energieerzeugung ausbauen.
              </p>
            }
          </section>
        }

        <!-- ── Ressourcen-Grid ────────────────────────────────────────── -->
        <section>
          <h2 class="mb-2 text-sm font-medium text-[var(--text-muted)]">Ressourcen</h2>
          @if (store.storableResources().length === 0) {
            <div class="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--text-muted)]">
              Noch keine Ressourcen — <a routerLink="/buildings" class="text-[var(--primary)]">jetzt bauen</a>.
            </div>
          } @else {
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              @for (stock of store.storableResources(); track stock.resource) {
                <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div class="flex items-baseline justify-between">
                    <span class="text-sm text-[var(--text-muted)]">{{ stock.resource }}</span>
                    <span class="text-xs tabular-nums"
                          [class]="stock.ratePerHour < 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'">
                      {{ stock.ratePerHour | compactNumber: true }}/h
                    </span>
                  </div>
                  <div class="mt-1 text-lg font-semibold tabular-nums">
                    {{ stock.amount | compactNumber }}
                  </div>
                  @if (stock.capacity > 0) {
                    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"
                         [title]="stock.amount + ' / ' + stock.capacity">
                      <div class="h-full rounded-full"
                           [class]="fillRatio(stock.amount, stock.capacity) >= 0.9 ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'"
                           [style.width.%]="fillRatio(stock.amount, stock.capacity) * 100"></div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </section>

        <!-- ── Laufender Bau + aktive Forschung ───────────────────────── -->
        <section class="grid gap-3 md:grid-cols-2">
          <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 class="text-sm font-medium text-[var(--text-muted)]">🏗 Bau</h2>
            @if (store.activeConstruction(); as job) {
              <div class="mt-2 flex items-center justify-between">
                <span class="font-medium">{{ job.buildingCode }} → L{{ job.targetLevel }}</span>
                <span class="tabular-nums text-[var(--primary)]">
                  ⏱ {{ remaining(job.completesAt) }}
                </span>
              </div>
            } @else {
              <p class="mt-2 text-sm text-[var(--text-muted)]">
                Kein Bau aktiv —
                <a routerLink="/buildings" class="text-[var(--primary)]">Gebäude bauen</a>
              </p>
            }
          </div>

          <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 class="text-sm font-medium text-[var(--text-muted)]">🔬 Forschung</h2>
            @if (store.activeResearch(); as job) {
              <div class="mt-2 flex items-center justify-between">
                <span class="font-medium">{{ job.name }}</span>
                <span class="tabular-nums text-[var(--primary)]">
                  ⏱ {{ remaining(job.completesAt) }}
                </span>
              </div>
            } @else {
              <p class="mt-2 text-sm text-[var(--text-muted)]">
                Keine Forschung aktiv —
                <a routerLink="/research" class="text-[var(--primary)]">Techbaum öffnen</a>
              </p>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly store = inject(DashboardStore);
  readonly #destroyRef = inject(DestroyRef);

  /** 1-s-Tick für Countdowns (nur Anzeige — Zustand kommt immer vom Server). */
  readonly #now = signal(Date.now());
  /** Serverzeit-Schätzung: Client-Uhr + Offset (Client-Zeit-Regel, docs/06 §6). */
  readonly #serverNow = computed(() => this.#now() + this.store.serverOffsetMs());

  /** Bereits behandelte Ablaufzeitpunkte (verhindert Refresh-Spam pro Tick). */
  readonly #handledExpiries = new Set<string>();

  ngOnInit(): void {
    this.store.startPolling();
    const tick = setInterval(() => {
      this.#now.set(Date.now());
      this.#refreshOnExpiry();
    }, 1000);
    this.#destroyRef.onDestroy(() => clearInterval(tick));
  }

  /** Läuft ein Countdown ab, holt ein gezielter Refresh den Serverzustand. */
  #refreshOnExpiry(): void {
    const jobs = [this.store.activeConstruction(), this.store.activeResearch()];
    for (const job of jobs) {
      if (!job) continue;
      const key = job.completesAt;
      if (Date.parse(key) <= this.#serverNow() && !this.#handledExpiries.has(key)) {
        this.#handledExpiries.add(key);
        void this.store.refresh({ silent: true });
      }
    }
  }

  protected fillRatio(amount: number, capacity: number): number {
    return Math.min(1, amount / capacity);
  }

  protected remaining(completesAt: string): string {
    const ms = Date.parse(completesAt) - this.#serverNow();
    if (ms <= 0) {
      // Abgelaufen — #refreshOnExpiry() holt den bestätigten Serverzustand
      return 'fertig …';
    }
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
}
