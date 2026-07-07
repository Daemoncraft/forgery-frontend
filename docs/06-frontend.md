# Foundry – Frontend (Angular 20)

> Verbindliche Referenz für das Frontend. Spielwerte, IDs und Formeln kommen ausschließlich
> aus dem [Spiel-Kanon im Backend-Repo](https://github.com/Daemoncraft/forgery-backend/blob/main/docs/00-canon.md)
> (dort liegen auch API-Spezifikation und alle gemeinsamen Dokumente) — dieses Dokument
> definiert Architektur, UI/UX und Technik-Entscheidungen.

Stack: Angular 20 (Standalone Components, Signals, neue Control-Flow-Syntax), Tailwind CSS,
PrimeNG (Tabellen/Dialoge), Apache ECharts (Charts), @angular/pwa. Backend: REST unter `/api`
mit JWT (Access + Refresh).

---

## 1. Architektur

### 1.1 Grundprinzipien

- **Standalone Components** durchgängig, keine NgModules.
- **OnPush überall** — Zustand fließt ausschließlich über Signals, keine Zone-getriebene CD-Abhängigkeit.
- **Server ist autoritativ** (Kanon §1): Das Frontend zeigt nur an, was der Server berechnet.
  Es gibt keine clientseitige Spiellogik, die Ressourcen "hochzählt" und dann committet —
  Anzeigen wie live tickende Ressourcenstände sind reine **Extrapolation zur Anzeige**
  (Bestand + ratePerHour × Zeit seit Serverantwort) und werden bei jedem Refresh vom Server überschrieben.
- **Ein Signal Store pro Feature**, typisierte API-Services pro Bounded Context, dünne Komponenten.

### 1.2 Signal Stores (Muster)

Pro Feature existiert genau eine `@Injectable`-Store-Klasse (`<feature>.store.ts`, Kanon §11):

- **Private writable Signals** für den Rohzustand (`#resources = signal<ResourceStock[]>([])`).
- **Öffentliche readonly Signals** (`resources = this.#resources.asReadonly()`) — Komponenten
  können nie direkt schreiben.
- **`computed()`** für abgeleitete Sichten (z. B. Energie-Throttle-Faktor, sortierte Listen).
- **Async-Methoden** (`async load()`, `async refresh()`, Aktionen wie `startUpgrade(id)`)
  kapseln API-Aufrufe über den jeweiligen API-Service und schreiben Ergebnisse in die Signals.
  Fehler landen im Error-Interceptor (Toast), der Store setzt nur `loading`/`error`-Flags.
- Stores sind `providedIn: 'root'` (Zustand überlebt Navigation) — Ausnahme: rein
  screen-lokale Stores dürfen an der Route provided werden.

```ts
@Injectable({ providedIn: 'root' })
export class InventoryStore {
  readonly #api = inject(InventoryApi);
  readonly #stocks = signal<ResourceStock[]>([]);
  readonly #loading = signal(false);

  readonly stocks = this.#stocks.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly nearCapacity = computed(() =>
    this.#stocks().filter(s => s.capacity > 0 && s.amount / s.capacity > 0.9));

  async refresh(): Promise<void> {
    this.#loading.set(true);
    try { this.#stocks.set(await this.#api.getStocks()); }
    finally { this.#loading.set(false); }
  }
}
```

### 1.3 REST-Client-Layer

- `core/api/api-client.ts`: dünner, typisierter Wrapper um `HttpClient`
  (`get<T>/post<T>/patch<T>/delete<T>`, Basis-URL `/api`, Promise-basiert via `firstValueFrom`).
- **Ein API-Service pro Kontext** (`inventory.api.ts`, `market.api.ts`, …) mit typisierten
  Methoden gegen die DTOs aus `shared/models`. Kein Feature ruft `HttpClient` direkt auf.
- Fehlerformat: RFC-7807 Problem Details (Kanon §11) — der Error-Interceptor mappt
  `title`/`detail` auf Toasts.

### 1.4 Interceptors

| Interceptor | Aufgabe |
|---|---|
| `authInterceptor` | Hängt `Authorization: Bearer <accessToken>` an alle `/api`-Requests (außer `/api/auth/*`). Bei **401**: einmaliger Refresh-Flow — Refresh-Token gegen `/api/auth/refresh` tauschen, ursprünglichen Request mit neuem Token **wiederholen**; parallele 401s teilen sich denselben Refresh-Vorgang (Single-Flight). Schlägt der Refresh fehl → Logout + Redirect `/login`. |
| `errorInterceptor` | Fängt HTTP-Fehler (außer 401, das behandelt der Auth-Interceptor), extrahiert Problem-Details und zeigt einen Toast. 0/5xx → generische "Server nicht erreichbar"-Meldung. Requests können via `HttpContext`-Token Toasts unterdrücken (z. B. Polling). |

### 1.5 Guards

- `authGuard` (`CanActivateFn`): prüft `AuthStore.isAuthenticated()`; sonst Redirect auf
  `/login?returnUrl=…`.
- `adminGuard`: zusätzlich `currentPlayer().roles` enthält `ADMIN`; sonst Redirect `/dashboard`.

### 1.6 Routing

Alle Features **lazy** über `loadChildren`/`loadComponent` (siehe `app.routes.ts`).
Layout-Shell (`core/layout`) als Eltern-Route mit `authGuard`; `/login`, `/register` außerhalb der Shell.

---

## 2. Ordnerstruktur (verbindlich)

```
src/app/
├── app.routes.ts            # Root-Routen, alle Features lazy
├── app.config.ts            # Provider: Router, HttpClient+Interceptors, Animations, SW
├── core/                    # Einmalige Infrastruktur, kein Feature-Code
│   ├── auth/                # AuthStore (Token, login/logout/refresh, currentPlayer), auth.api.ts
│   ├── api/                 # api-client.ts (Basis-Wrapper), gemeinsame API-Typen (ApiError)
│   ├── interceptors/        # auth.interceptor.ts, error.interceptor.ts
│   ├── guards/              # auth.guard.ts, admin.guard.ts
│   ├── layout/              # Shell: Sidebar (Desktop), Bottom-Nav (Mobile), Topbar, Toast-Host
│   └── config/              # App-Konstanten (Polling-Intervalle, Basis-URL), Env-Zugriff
├── shared/                  # Wiederverwendbar, feature-agnostisch, ohne Zustand
│   ├── ui/                  # Dumb Components: ProgressBar, Skeleton, EmptyState, ErrorState,
│   │                        #   ResourceIcon, StatCard, CountdownBadge, ConfirmDialog-Wrapper
│   ├── pipes/               # compactNumber, countdown, duration, coin
│   ├── directives/          # z. B. longPress, autofocus
│   ├── utils/               # serverzeit-Offset-Helper, Formatierung, Typ-Guards
│   └── models/              # game.models.ts — API-DTOs & Ressourcen-Codes (Kanon §3–§6)
└── features/                # Ein Ordner je Feature: routes.ts, *.store.ts, *.api.ts, Komponenten
    ├── dashboard/           # Übersicht (siehe §3.2)
    ├── inventory/           # Lager: Bestände, Kapazität, Reservierungen, NPC-Verkauf/-Notkauf
    ├── buildings/           # Gebäudeliste + Detail, Bau/Upgrade, Rezeptwahl, Slots
    ├── production/          # Produktionsübersicht: Raten je Ressource, Ketten, Throttle-Analyse
    ├── research/            # Techbaum (Tier-Liste), aktive Forschung, FP-Stand
    ├── market/              # Listings, eigene Angebote, Kauf/Verkauf, Preishistorie
    ├── leaderboard/         # Net Worth / Production Score / Market Volume (Kanon §9)
    ├── rewards/             # Daily Reward (Streak), Achievements (Kanon §7.8/§8)
    ├── profile/             # Spielerprofil, Level/XP, Statistiken, Einstellungen, Logout
    └── admin/               # Admin: Spieler-Suche, Config-Einsicht, Events (nur Rolle ADMIN)
```

Regeln: `features/*` importiert aus `shared/*` und `core/*`, nie aus anderen Features.
`shared/*` importiert nichts aus `core/*` oder `features/*`. `core/*` importiert nur aus `shared/models`.

---

## 3. UI/UX-Konzept

Leitbild: **SaaS-Dashboard, nicht Fantasy-Game-UI.** Klare Typografie, Karten, Tabellen,
dezente Akzentfarben — die Zahlen sind der Star. Dark Mode ist Default.

### 3.1 Navigation

Hauptnavigation (Reihenfolge = Priorität):
**Dashboard, Produktion, Gebäude, Forschung, Markt, Lager, Leaderboard, Belohnungen, Profil, Admin** (Admin nur mit Rolle).

- **Desktop (≥ 1024 px):** fixe Sidebar links (72 px collapsed / 240 px expanded), Icons + Label,
  aktiver Eintrag mit Akzent-Indikator. Topbar mit Coins-, FP- und Energie-Kurzanzeige + Spieler-Avatar.
- **Mobile (< 1024 px):** Bottom-Nav mit **max. 5 Items**:
  `Dashboard · Gebäude · Produktion · Markt · Mehr`.
  „Mehr" öffnet ein Sheet mit Forschung, Lager, Leaderboard, Belohnungen, Profil, Admin.
  Badge-Punkte auf Nav-Items (z. B. Daily Reward abholbar, Forschung fertig).

### 3.2 Dashboard

Inhalte (Priorität von oben nach unten):

1. **Ressourcenübersicht** — Grid der lagerbaren Ressourcen: Bestand (kompakt), Nettorate/h
   (grün +/rot −), Kapazitäts-Progress-Bar (Warnfarbe > 90 %, Kanon §7.5: Überlauf verfällt!).
2. **Energie-Bilanz-Widget** — Erzeugung/h vs. Verbrauch/h; bei Verbrauch > Erzeugung prominente
   **Throttle-Warnung** mit Faktor („Produktion läuft bei 72 %", Kanon §1).
3. **Laufender Bau** — Gebäude, Ziellevel, Countdown (max. 1 aktiv, Kanon §7.2). Leerer Zustand: CTA „Bauen".
4. **Aktive Forschung** — Tech-Name, FP-Kosten, Countdown (max. 1 aktiv, Kanon §6).
5. **Marktchancen** — 3–5 Listings deutlich unter Referenzpreis (nur wenn T18 erforscht).
6. **Daily-Reward-Hinweis** — Banner/Karte wenn abholbar, mit Streak-Tag (Kanon §7.8).
7. **Level-Fortschritt** — XP-Bar zum nächsten Level, Hinweis „+1 Bauplatz" (Kanon §7.6).

```
┌────────────────────────────────────────────────────────────────┐
│ ⚡ Energie  240/h erzeugt · 310/h Bedarf   ▓▓▓▓▓▓▓░░ 77 %      │
│ ⚠ Produktion gedrosselt auf 77 %                               │
├───────────────┬───────────────┬───────────────┬────────────────┤
│ Holz          │ Stein         │ Eisen         │ Stahl          │
│ 12.4k  +180/h │ 8.1k   +50/h  │ 940   −12/h   │ 312   +11/h    │
│ ▓▓▓▓▓▓▓▓░ 92%│ ▓▓▓▓▓░░░ 60% │ ▓░░░░░░░  9% │ ▓▓░░░░░░ 23%  │
├───────────────┴───────────────┼───────────────┴────────────────┤
│ 🏗 Bau: Stahlwerk → L4        │ 🔬 Forschung: Werkzeugbau      │
│    ⏱ 12:41 verbleibend        │    ⏱ 43:10 verbleibend         │
├───────────────────────────────┼────────────────────────────────┤
│ 💰 Marktchancen               │ 🎁 Daily Reward Tag 5 abholen! │
│  Kupfer 2.1 C (Ref 3.0)  Kauf │ ────────────────────────────── │
│  Bretter 2.2 C (Ref 3.0) Kauf │ Level 7  ▓▓▓▓▓▓░░░░ 4.2k/6.1k │
└───────────────────────────────┴────────────────────────────────┘
```

### 3.3 Gebäude — Liste + Detail

**Liste:** Karten-Grid der eigenen Instanzen (Icon, Name, Level, aktives Rezept, Rate,
Throttle-Badge) + Slot-Anzeige („14/16 Bauplätze"). Sekundärer Tab „Katalog" mit baubaren
Gebäuden (gesperrte mit Tech-Hinweis). Filter nach Kategorie.

```
Bauplätze: 14/16                       [Meine Gebäude] [Katalog]
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🪓 Holzfäller│ │ 🪓 Holzfäller│ │ ⚙ Sägewerk  │ │ 🔥 Kraftwerk │
│ Level 4     │ │ Level 2     │ │ Level 3     │ │ Level 2     │
│ +156 Holz/h │ │ +84 Holz/h  │ │ +36 Brett/h │ │ +56 ⚡/h    │
│             │ │ [Upgrade ▲] │ │ ⚠ 77 %      │ │ 🔥 −14 Kohle│
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

**Detail:** Kopf (Icon, Name, Level, Kategorie) · Rezept-Sektion (aktives Rezept, In-/Outputs/h
auf aktuellem Level, Rezept-Umschalter wenn Alternativen freigeschaltet, Kanon §5) ·
Upgrade-Sektion (Kosten je Komponente aus §7.1 mit „hast/brauchst", Dauer aus §7.2,
Vorschau der neuen Rate, Button disabled wenn bereits ein Bau läuft) · Energiezeile.

```
┌ ⚙ Stahlwerk · Level 3 ────────────────────────────────────────┐
│ Rezept: steel_basic          [wechseln ▾]                     │
│  in:  −36 Eisen/h  −18 Kohle/h        out: +18 Stahl/h        │
│  ⚡ 7.2/h · läuft bei 77 % (Energie)                           │
├───────────────────────────────────────────────────────────────┤
│ Upgrade auf Level 4                                           │
│  3 277 C ✓ · 614 Ziegel ✗ (412/614) · 410 Bretter ✓           │
│  Dauer 19:41 → neue Rate +25.2 Stahl/h                        │
│  [ Upgrade starten ]  (deaktiviert: Bau läuft bereits)        │
└───────────────────────────────────────────────────────────────┘
```

### 3.4 Markt

Freigeschaltet erst mit T18 (sonst Empty State mit Link zur Forschung).
Layout: Filterleiste (Ressource, Preis, nur unter Referenz, Sortierung) → **Listings-Tabelle**
(PrimeNG-Table: Ressource, Menge, Stückpreis, Δ zum Referenzpreis, Verkäufer, Restlaufzeit, Kauf-Button
mit Teilkauf-Dialog) → rechts/unten **Preischart** (ECharts-Liniendiagramm, Preishistorie der
gewählten Ressource mit Referenzpreis-Linie und Leitplanken 0.25×/4×, Kanon §7.7).
Tabs: „Kaufen" · „Meine Listings" (max 30, mit Cancel → Reservierung zurück) · „Verkaufen"
(Formular: Ressource, Menge ≤ frei, Stückpreis mit Leitplanken-Validierung, Ablauf 24/48/72 h, Gebührenvorschau 5 %/4 %).

```
[Ressource: Stahl ▾] [max Preis __] [☑ unter Referenz]  [Kaufen|Meine|Verkaufen]
┌──────────┬───────┬─────────┬────────┬──────────┬───────┐ ┌───────────────────┐
│ Ressource│ Menge │ Preis/St│ Δ Ref  │ Läuft ab │       │ │ Stahl – 7 Tage    │
│ Stahl    │ 240   │ 8.4 C   │ −16 %  │ 23 h     │ [Kauf]│ │     ╭─╮   Ref 10  │
│ Stahl    │ 80    │ 9.1 C   │ −9 %   │ 41 h     │ [Kauf]│ │ ╭──╯  ╰─╮ ─ ─ ─ ─ │
│ Stahl    │ 500   │ 11.8 C  │ +18 %  │ 70 h     │ [Kauf]│ │╯        ╰──╮  ╭── │
└──────────┴───────┴─────────┴────────┴──────────┴───────┘ └───────────────────┘
```

### 3.5 Forschungsbaum

**Darstellung als Tier-gruppierte Liste, kein Graph-Rendering im MVP.** Begründung:
Der Kanon-Baum hat nur 20 Techs mit maximal 2 Voraussetzungen und geringer Tiefe — ein
Graph-Layout (Dagre/eigenes SVG) kostet erheblichen Implementierungs- und vor allem
Responsive-Aufwand (Panning/Zoom auf Mobile), liefert bei dieser Größe aber kaum
Orientierungsgewinn gegenüber einer Liste. Abhängigkeiten werden stattdessen als
Chips auf der Karte gezeigt („benötigt: Bergbau I ✓, Energieerzeugung ✗") und sind
antippbar (Scroll zur Voraussetzung). Ein visueller Baum ist Post-MVP-Kandidat.

Gruppierung in Tiers nach Abhängigkeitstiefe (Tier 0 = ohne Voraussetzungen).
Karte je Tech: Name, FP-Kosten, Dauer, Effekt, Status (erforscht ✓ / verfügbar [Forschen] /
gesperrt 🔒 mit fehlenden Voraussetzungen). Kopfbereich: FP-Bestand + aktive Forschung mit Countdown.

```
FP: 143          🔬 Aktiv: Stahlverhüttung ⏱ 12:05
── Tier 0 ────────────────────────────────────────
[✓ Holzverarbeitung] [✓ Tonbrennerei] [✓ Bergbau I] [Marktlizenz 30 FP ▶]
── Tier 1 ────────────────────────────────────────
[✓ Bergbau II] [Kohleabbau 20 FP ▶] [🔒 Logistik II — benötigt Logistik I]
── Tier 2 ────────────────────────────────────────
[⏳ Stahlverhüttung] [🔒 Kupferverarbeitung — benötigt Energieerzeugung ✗]
```

### 3.6 Weitere Screens (Kurzbeschreibung)

- **Produktion:** Netto-Raten je Ressource (Tabelle: erzeugt/verbraucht/netto pro Stunde),
  Aufschlüsselung pro Gebäude, Engpass-Hinweise (Input fehlt / Lager voll / Energie-Throttle).
- **Lager (Inventory):** Tabelle aller Bestände mit `amount/reserved/capacity`, Kapazitätsbalken,
  NPC-Verkauf (60 % Ref) und NPC-Notkauf (140 % Ref) direkt aus der Zeile (Kanon §10).
- **Leaderboard:** Tabs für die drei Boards (Kanon §9), eigene Platzierung fixiert (sticky).
- **Belohnungen:** Daily-Reward-Streak-Leiste (7 Tage, heutiger Tag hervorgehoben, Claim-Button),
  darunter Achievements-Grid mit Fortschritt (Kanon §8).
- **Profil:** Avatar/Name, Level + XP-Bar, Bauplätze, Lifetime-Statistiken, Theme-Umschalter, Logout.
- **Admin:** Spieler-Suche/-Detail, Config-Tabellen (read-only Einsicht), Event-Multiplikatoren.

---

## 4. Design-System

### 4.1 Art-Direction & Tailwind-Token

Modern, clean, leicht futuristisch-industriell, freundlich. **Dark Mode als Default**,
Light Mode via `class`-Strategie (`<html class="dark">`, Toggle im Profil, `prefers-color-scheme` als Initialwert).

Token als CSS-Variablen + Tailwind-Theme (Auszug):

| Token | Dark (Default) | Light | Verwendung |
|---|---|---|---|
| `--bg` | `#0b0f14` | `#f6f7f9` | App-Hintergrund |
| `--surface` | `#141a22` | `#ffffff` | Karten, Sidebar |
| `--surface-2` | `#1c2430` | `#eef1f5` | Hover, Tabellenzeilen |
| `--border` | `#26303d` | `#dde3ea` | Rahmen, Divider |
| `--text` | `#e8edf2` | `#111827` | Primärtext |
| `--text-muted` | `#8a97a6` | `#6b7280` | Sekundärtext |
| `--primary` | `#38bdf8` (Cyan) | `#0284c7` | Aktionen, aktive Nav, Links |
| `--accent` | `#f59e0b` (Amber) | `#d97706` | Energie, Highlights, "industriell" |
| `--success` | `#34d399` | `#059669` | positive Raten, erledigt |
| `--warning` | `#fbbf24` | `#b45309` | Throttle, Lager > 90 % |
| `--danger` | `#f87171` | `#dc2626` | negative Raten, Fehler |

Typografie: Inter (UI) + `tabular-nums` für alle Zahlen/Zähler (kein Zappeln bei Countdowns).
Radius `rounded-xl` für Karten, `rounded-lg` für Controls; Schatten sparsam (Dark Mode: Border statt Schatten).

### 4.2 Bausteine

- **Zahlenformatierung:** `compactNumber`-Pipe — < 1000 exakt, dann `1.2k`, `3.4M`, `1.1B`
  (eine Nachkommastelle, deutsches Locale-Komma optional per Param). Coins mit Suffix „C".
- **Countdown:** `countdown`-Pipe (Signal-basiert, 1s-Tick, Format `hh:mm:ss` bzw. `mm:ss`,
  ab 24 h `1d 3h`) + `CountdownBadge`-Komponente; rechnet **immer** auf Serverzeit-Offset (§6).
- **Progress Bars:** `shared/ui/progress-bar` — Varianten default/warning/danger, für
  Lagerkapazität, XP, Bau-/Forschungsfortschritt.
- **Skeleton Loading:** Skeleton-Blöcke je Kartentyp; angezeigt beim Erstladen (nicht beim Polling-Refresh).
- **Empty States:** Icon + Satz + CTA (z. B. „Noch keine Gebäude — jetzt bauen"). **Error States:**
  Inline-Karte mit Retry-Button (für fehlgeschlagene Erstladungen; transiente Fehler → Toast).
- **Toasts:** PrimeNG Toast, Host im Layout; Fehler (Error-Interceptor), Erfolg (Aktionen),
  Info (z. B. „Forschung abgeschlossen" beim Polling-Delta).
- **Dialoge:** PrimeNG Dialog/ConfirmDialog — Kauf-/Teilkauf-Dialog, Upgrade-Bestätigung,
  Listing-Erstellung; Mobile als Bottom-Sheet-artige Fullwidth-Dialoge.

### 4.3 Komponentenbibliothek: PrimeNG + Tailwind

**Entscheidung:** PrimeNG für datenintensive Widgets (Table, Dialog, Toast, Select, Paginator),
Tailwind für Layout, Karten und alles Custom.

Begründung: Der Markt und die Leaderboards brauchen ausgereifte Tabellen (Sortierung, Filter,
Paging, Responsive) — das selbst zu bauen ist MVP-untauglich; PrimeNG liefert das a11y-getestet
und ist mit dem unstyled/Tailwind-Theming (PrimeNG v18+ Design-Token) sauber an unsere Token
anbindbar. Volle Bibliotheken wie Material erzwingen dagegen eine eigene Designsprache, die dem
SaaS-Custom-Look im Weg steht; reine Headless-Ansätze (CDK only) kosten zu viel Eigenbau.
Grenze: Keine PrimeNG-Layout-Komponenten — Grid/Flex ausschließlich mit Tailwind.

### 4.4 Charts: Apache ECharts (via ngx-echarts)

**Entscheidung:** ECharts statt Chart.js. Begründung: Der Haupt-Use-Case sind **Zeitreihen**
(Markt-Preishistorie, später Produktions-/Net-Worth-Verläufe). ECharts bietet dafür out-of-the-box
deutlich mehr: `dataZoom` (Zoom/Pan in Zeitreihen), performantes Canvas-Rendering großer Serien,
`markLine` (Referenzpreis + Leitplanken direkt einzeichenbar), besseres Tooltip-/Achsen-Handling
und deklarative Option-Objekte, die gut zu Signal-`computed` passen. Chart.js ist leichter,
bräuchte aber für Zoom/Pan und Annotationen mehrere Plugins mit uneinheitlicher Qualität.
Bundle-Kosten werden begrenzt: ECharts wird nur in Chart-Komponenten importiert (tree-shakbare
Module, lazy Feature-Route) — Nicht-Markt-Nutzer laden es nie.

---

## 5. PWA

- Setup über `@angular/pwa` (Angular Service Worker, `ngsw-config.json`).
- **Caching-Strategie:**
  - **App-Shell** (index.html, JS/CSS-Bundles): precache (`installMode: prefetch`).
  - **API (`/api/**`):** network-first mit kurzem Timeout (`freshness`, `maxAge` wenige Sekunden) —
    Spieldaten dürfen nie stale-first sein, der Server ist autoritativ.
  - **Icons/Assets/Fonts:** cache-first (`performance`, lange `maxAge`), da versioniert/immutabel.
- **Installierbarkeit:** Manifest (Name „Foundry", Theme-Color `#0b0f14`, maskable Icons,
  `display: standalone`); dezenter Install-Hinweis im Profil (kein aufdringlicher Prompt).
- **Kein Offline-Gameplay:** Da der Server autoritativ ist (Kanon §1) und lazy rechnet, gibt es
  offline nichts Sinnvolles zu tun — keine Aktions-Queues, kein optimistisches Offline-Schreiben.
  Offline zeigt die App eine **Offline-Hinweisseite** (erkannt via `navigator.onLine` +
  fehlgeschlagene API-Calls) mit Retry-Button. Update-Flow: `SwUpdate` → Toast „Neue Version — neu laden".

---

## 6. Client-Zeit-Regel (verbindlich)

- Jede relevante API-Antwort enthält die **Serverzeit** (`serverTime`, ISO-8601) und Endzeitpunkte
  als absolute Server-Timestamps (`completesAt`), niemals als Restsekunden-Snapshot allein.
- Der Client berechnet einmal pro Antwort `offset = serverTime − Date.now()` (geglättet über die
  letzten Antworten, Helper in `shared/utils`) und rechnet alle Countdowns als
  `completesAt − (Date.now() + offset)`.
- **Client-Zeit wird nie für Spiellogik verwendet:** kein Freischalten von Buttons rein per
  abgelaufenem Client-Countdown ohne Server-Bestätigung — läuft ein Countdown ab, wird der Zustand
  per Refresh vom Server geholt (der Server schließt Bau/Forschung lazy ab). Verstellte Systemuhren
  dürfen maximal die Anzeige, nie den Zustand beeinflussen.

---

## 7. Performance

- **Lazy Routes** pro Feature (einzige Eager-Teile: Shell, AuthStore, Interceptors).
- **`@defer`-Blocks** für schwere Below-the-fold-Inhalte: Preischart (`on viewport`),
  Achievements-Grid, Admin-Tabellen.
- **OnPush + Signals** überall; Listen mit `@for (…; track item.id)`.
- **Polling statt WebSocket im MVP:** Der Server rechnet lazy (Kanon §1) — es gibt keine
  Server-Push-Ereignisse, die nicht auch beim nächsten Poll sichtbar wären. Intervalle:
  **Dashboard 30 s**, **Markt 15 s** (höhere Preisdynamik), übrige Screens laden bei Aktivierung +
  nach eigenen Aktionen. Polling pausiert bei `document.hidden` (Page Visibility API) und
  triggert sofort bei Rückkehr. Countdown-Abläufe triggern einen gezielten Refresh.
  WebSocket/SSE ist Post-MVP (Kandidat: Markt-Ticker, Chat).
- Bilder/Icons als SVG-Sprite (`iconKey` aus Kanon §4), keine Icon-Font.
