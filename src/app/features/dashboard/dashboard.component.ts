import { DatePipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { DashboardStore } from './dashboard.store';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CompactNumberPipe, PercentPipe, DatePipe],
  template: `
    <div class="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold text-[var(--text)]">Dashboard</h1>
          @if (auth.currentPlayer(); as player) {
            <p class="text-sm text-[var(--text-muted)]">
              {{ auth.playerName() }} · Level {{ player.level }} · {{ player.xp }} XP
            </p>
          }
        </div>
        <div class="flex items-center gap-3">
          @if (store.lastCalculatedAt(); as at) {
            <span class="text-xs text-[var(--text-muted)]">
              Stand (Serverzeit): {{ at | date: 'HH:mm:ss' }}
            </span>
          }
          <button
            type="button"
            (click)="collect()"
            [disabled]="store.collecting() || store.loading()"
            class="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--bg)] disabled:opacity-50"
          >
            {{ store.collecting() ? 'Sammle …' : '⛏ Produktion einsammeln' }}
          </button>
        </div>
      </div>

      @if (store.error(); as message) {
        <div class="rounded-xl border border-[var(--danger)] p-4 text-sm text-[var(--danger)]">
          {{ message }}
          <button type="button" class="ml-2 underline" (click)="refresh()">Erneut versuchen</button>
        </div>
      } @else if (store.loading() && !store.loaded()) {
        <!-- Skeleton beim Erstladen -->
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
            <div class="h-24 animate-pulse rounded-xl bg-[var(--surface-2)]"></div>
          }
        </div>
      } @else {
        <!-- ── Einsammel-Ergebnis ─────────────────────────────────────── -->
        @if (store.lastCollect(); as delta) {
          <section class="rounded-xl border border-[var(--success)] bg-[var(--surface)] p-4 text-sm">
            <span class="font-medium text-[var(--success)]">Eingesammelt:</span>
            @if (delta.produced.length === 0) {
              <span class="text-[var(--text-muted)]"> nichts Neues (Zeitraum zu kurz oder Lager voll).</span>
            } @else {
              @for (item of delta.produced; track item.code) {
                <span class="ml-2 tabular-nums">+{{ item.amount | compactNumber }} {{ item.code }}</span>
              }
            }
            @for (lost of delta.overflowLost; track lost.code) {
              <span class="ml-2 tabular-nums text-[var(--warning)]">
                ({{ lost.amount | compactNumber }} {{ lost.code }} verfallen — Lager voll)
              </span>
            }
          </section>
        }

        <!-- ── Energie-Bilanz ─────────────────────────────────────────── -->
        @if (store.energy(); as energy) {
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
                {{ energy.throttle | percent: '1.0-0' }}
              </span>
            </div>
            @if (store.throttled()) {
              <p class="mt-2 text-sm text-[var(--warning)]">
                ⚠ Produktion gedrosselt — Energieerzeugung ausbauen.
              </p>
            }
          </section>
        }

        <!-- ── Ressourcen mit Kapazität und Rate ──────────────────────── -->
        <section>
          <h2 class="mb-2 text-sm font-medium text-[var(--text-muted)]">Ressourcen</h2>
          @if (store.resources().length === 0) {
            <div class="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--text-muted)]">
              Noch keine Ressourcen —
              <a routerLink="/buildings" class="text-[var(--primary)]">jetzt bauen</a>.
            </div>
          } @else {
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              @for (row of store.resources(); track row.code) {
                <div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div class="flex items-baseline justify-between">
                    <span class="text-sm text-[var(--text-muted)]">{{ row.name }}</span>
                    @if (row.netPerHour !== 0) {
                      <span class="text-xs tabular-nums"
                            [class]="row.netPerHour < 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'">
                        {{ row.netPerHour | compactNumber: true }}/h
                      </span>
                    }
                  </div>
                  <div class="mt-1 text-lg font-semibold tabular-nums">
                    {{ row.amount | compactNumber }}
                    <span class="text-xs font-normal text-[var(--text-muted)]">
                      / {{ row.capacity | compactNumber }}
                    </span>
                  </div>
                  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"
                       [title]="row.amount + ' / ' + row.capacity">
                    <div class="h-full rounded-full"
                         [class]="fillRatio(row) >= 0.9 ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'"
                         [style.width.%]="fillRatio(row) * 100"></div>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <p class="text-xs text-[var(--text-muted)]">
          Alle Werte sind serverseitig berechnet (Lazy Production, Serverzeit ist autoritativ).
          <a routerLink="/buildings" class="text-[var(--primary)]">→ Gebäude bauen/upgraden</a>
        </p>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly store = inject(DashboardStore);
  protected readonly auth = inject(AuthStore);

  ngOnInit(): void {
    void this.store.refresh();
  }

  protected refresh(): void {
    void this.store.refresh();
  }

  protected collect(): void {
    void this.store.collect();
  }

  protected fillRatio(row: { amount: number; capacity: number }): number {
    return row.capacity > 0 ? Math.min(1, row.amount / row.capacity) : 0;
  }
}
