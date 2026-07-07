# Forgery – UX-Konzept & Visual Direction (v1.0)

> **Status: Verbindliche Zielrichtung.** Dieses Dokument ersetzt das UI/UX-Leitbild aus
> `docs/06-frontend.md` §3 („SaaS-Dashboard, nicht Fantasy-Game-UI") und erweitert die
> Art Bible (`backend/docs/10-art-bible.md`). Technik-Entscheidungen aus docs/06 §1–§2
> (Architektur, Stores, Interceptors, Routing) bleiben unverändert gültig.
>
> Kein Implementierungsplan — ein Zielbild. Umsetzung erfolgt in Phasen (Teil K).
>
> Namenskonvention: Dieses Dokument verwendet den Produktnamen **Forgery**
> (Repo-Name). Ältere Dokumente verwenden den Arbeitstitel „Foundry" — gemeint ist
> dasselbe Produkt; der Name wird bei der Kanon-Pflege vereinheitlicht.

---

## Das eine Leitbild

**Forgery ist ein Browser-MMORPG mit Wirtschaftssimulation — kein Dashboard.**

Der Spieler besitzt eine Region, die über Monate und Jahre wächst. Die UI hat drei
klar getrennte Ebenen, die jeweils genau eine Aufgabe haben:

| Ebene | Aufgabe | Gefühl | Beispiel |
|---|---|---|---|
| **Region** (Spielwelt) | Emotion, Identität, sichtbarer Fortschritt | „Das ist MEINE Stadt" | Isometrische Regionsansicht mit Bezirken, Tag/Nacht, Zügen |
| **Menüs** (Management) | Kontrolle, Effizienz, Masse beherrschen | „Ich habe alles im Griff" | Gebäudeverwaltung mit Filtern über 1000 Instanzen |
| **Wirtschaft** (Markt & Ketten) | Langzeitmotivation, Optimierung, Wettbewerb | „Ich werde reicher/besser" | Trading-Interface, Produktionsketten, Ranglisten |

Jede Design-Entscheidung wird gegen diese Trennung geprüft: Die Region verwaltet
nichts. Die Menüs dekorieren nichts. Die Wirtschaft versteckt nichts.

**Harte Skalierungs-Grundregel:** Jede Ansicht muss mit 200+ Gebäudetypen,
1000+ Gebäudeinstanzen, 100+ Produktionsketten und 100+ offenen Orders funktionieren —
UI-seitig (keine endlosen Listen als Hauptinteraktion) und render-seitig (nichts
rendert linear mit der Objektanzahl). Aggregation ist der Default, das Einzelobjekt
der Drill-Down.

---

# Teil A — Analyse des Ist-Zustands

## A.1 Was existiert

| Screen | Zustand | Kurzbeschreibung |
|---|---|---|
| Login / Registrierung | fertig | Auth-Karten, Cookie-Refresh, solide |
| Shell / Layout | rudimentär | Eine Topbar: Logo, 2 Links (Dashboard, Gebäude), Coins, Name, Logout |
| Dashboard | MVP fertig | Ressourcen-Grid, Energie-Bilanz, Collect-Button, Skeletons |
| Gebäude | MVP fertig | Zwei Karten-Grids: „Meine Gebäude" + „Katalog", Bau/Upgrade |
| Produktion, Forschung, Markt, Lager, Leaderboard, Belohnungen, Profil, Admin | Platzhalter | „Dieses Feature ist in Arbeit." |

Technisches Fundament (Signals, OnPush, Lazy Routes, Server-autoritative Zeit,
Interceptors, Store-Muster) ist **gut** und bleibt. Die Analyse betrifft
ausschließlich UX und visuelle Ebene.

## A.2 Bewertung pro Kriterium

### Immersion — ✖ ungenügend (2/10)

- Es gibt **keine Spielwelt**. Der Spieler „besitzt" nichts Sichtbares — sein
  Fortschritt ist eine Zahl in einer Karte. Nach 3 Monaten Spielzeit sieht der
  Bildschirm identisch aus wie an Tag 1, nur mit größeren Zahlen.
- Emoji als Icons (⚙ 🪙 ⛏ 🏗) signalisieren Provisorium, nicht Produkt.
- Kein Ort, keine Atmosphäre, kein Tag/Nacht, keine Bewegung. Das erklärte
  Leitbild aus docs/06 („SaaS-Dashboard") wurde konsequent umgesetzt — und ist
  genau das Problem: Forgery fühlt sich an wie ein internes Admin-Tool mit
  Spielbegriffen.
- Der „Produktion einsammeln"-Moment — der emotionale Kern eines Idle-Loops —
  ist ein grauer Button mit einer Textzeile als Ergebnis.

### Spielfluss — ✖ schwach (3/10)

- Kern-Loop (Einsammeln → Bauen → Warten → Upgrade) funktioniert mechanisch,
  aber ohne jede Belohnungsdramaturgie: kein Feedback-Moment, keine Zähler-Animation,
  kein „Level up!", kein sichtbarer Zugewinn.
- Navigation Dashboard ↔ Gebäude ist ein harter Kontextwechsel ohne roten Faden.
  Warnungen (Energie-Throttle, Lager voll) verlinken nicht auf die Lösung.
- 8 von 10 Navigationszielen sind tote Enden (Platzhalter) — jeder Klick dorthin
  bestraft Neugier.

### Skalierbarkeit — ✖ kritisch (2/10)

- `buildings.component.ts` rendert **alle** Instanzen als flaches Karten-Grid
  (`@for` über `mine()!.buildings`) — bei 1000 Gebäuden: 1000 DOM-Karten, keine
  Virtualisierung, keine Gruppierung, keine Suche, keine Filter.
- Der Katalog rendert ebenso flach — bei 200+ Typen unbenutzbar.
- Das Ressourcen-Grid im Dashboard rendert jede Ressource als Karte — bei 50+
  Ressourcen (Backlog: Öl, Gas, Chips, …) bricht die Übersicht.
- Es gibt kein Aggregationskonzept, weder in der API-Nutzung noch in der UI.

### MMO-Tauglichkeit — ✖ nicht vorhanden (1/10)

- Kein einziges soziales Element sichtbar: keine anderen Spieler, kein Markt,
  keine Firmen, keine Allianzen, keine Nachrichten, keine Weltkarte, kein Chat.
- Nichts vermittelt „persistente Welt": kein Server-Puls, keine Events, keine
  News, kein „während du weg warst".

### Mobile UX — ✖ mangelhaft (3/10)

- Nur eine wrappende Topbar; die in docs/06 §3.1 spezifizierte Bottom-Nav
  existiert nicht. Bei schmalem Viewport bricht die Topbar mehrzeilig.
- Touch-Ziele teils < 40 px (Logout, Nav-Links). Keine Sheets, keine
  Thumb-Zone-Überlegungen.

### Desktop UX — ◐ funktional, aber leer (4/10)

- `max-w-6xl` verschenkt auf 1440p+ die Hälfte des Bildschirms.
- Keine Sidebar, keine Shortcuts, kein Multi-Panel — Desktop ist nur „Mobile breiter".

### Langfristige Erweiterbarkeit — ◐ gemischt (5/10)

- **Gut:** Feature-Ordner, Lazy Routes, Store-Muster, Token-CSS — neue Features
  finden strukturell Platz.
- **Schlecht:** Die Shell-Navigation ist hartkodiert auf 2 Links; das Layout hat
  keine Slots für HUD, Ticker, Badges, Overlays; das Token-Set (11 Farben) trägt
  kein Spiel (keine Seltenheits-, Kategorie-, Zustandsfarben); Emoji statt
  Icon-System; keine Komponentenbibliothek jenseits von Rohkarten.

## A.3 Kernbefund

> Das Frontend ist ein solides technisches Skelett mit der **falschen Haut und
> ohne Herz**. Nichts davon ist verlorene Arbeit — Stores, API-Layer und Routing
> tragen das neue Konzept vollständig. Aber Leitbild, Layout-Shell, Design-Token,
> Icon-Strategie und alle Screen-Konzepte müssen neu gedacht werden, und zwar
> JETZT, solange 8 von 10 Screens noch Platzhalter sind. Später wird jeder
> fertige Screen zur Hypothek.

---

# Teil B — Vision & Design-Prinzipien

## B.1 Erlebnis-Zielbild („Wie fühlt sich Forgery an?")

**Erste Session:** Der Spieler landet nicht auf einem Dashboard, sondern in
seiner Region — eine kleine Lichtung mit einem Lagerhaus, ein Fluss, Nebel über
den Hügeln. Ein Quest-Marker pulsiert. Er baut den ersten Holzfäller und **sieht
ihn in seiner Region erscheinen**, mit Bauanimation und Staubwolke.

**Nach 3 Monaten:** Dieselbe Kamerafahrt zeigt ein Industrietal: rauchende
Schlote im Fabrikviertel, ein Güterzug zieht Richtung Hafen, das Forschungs-
Campus-Dom leuchtet cyan in der Abenddämmerung. Der Spieler verwaltet seine 400
Gebäude längst über die Management-Screens — aber er kehrt zur Region zurück,
weil sie zeigt, **was er aufgebaut hat**.

**Jede Session:** Ein klarer Rhythmus — ankommen (Region + „während du weg
warst"), ernten (Collect mit Belohnungsmoment), entscheiden (Bauqueue, Forschung,
Orders), optimieren (Ketten, Markt), verlassen (alles läuft weiter — Server-Puls
sichtbar bis zuletzt).

## B.2 Die zehn Prinzipien

1. **Region zeigt, Menü verwaltet.** Kein Management auf der Karte (kein
   Clash-of-Clans-Tippen auf Einzelgebäude zum Upgraden), keine Weltgrafik in den
   Tabellen. Die Karte ist Einstieg und Belohnung, nie Pflicht.
2. **Aggregation ist der Default.** Jede Liste, jede Karte, jede Zahl zeigt
   zuerst die Summe (Bezirk, Kategorie, Kette) und erst auf Drill-Down das
   Einzelobjekt. 500 Sägewerke = 1 Kachel „Sägewerke ×500".
3. **Nichts rendert linear mit n.** DOM, Canvas und API-Payload sind gegen
   Instanzanzahl gedeckelt: Virtualisierung, LOD, Server-Aggregate, Pagination.
4. **Masse braucht Massenwerkzeuge.** Ab der ersten Version, in der ein Spieler
   10+ Instanzen eines Typs haben kann, existieren Multi-Select, Mass-Upgrade,
   Filter, gespeicherte Ansichten und Tags.
5. **Der Server pulsiert sichtbar.** Live tickende Extrapolation, Countdown-
   Badges, Event-Ticker, Marktbewegung — die Welt fühlt sich auch dann lebendig
   an, wenn der Spieler nichts tut. (Immer nur Anzeige-Extrapolation, Server
   bleibt autoritativ, docs/06 §6 gilt unverändert.)
6. **Jede Aktion hat einen Moment.** Bauen, Einsammeln, Forschung fertig,
   Level-Up, erster Verkauf — jede bedeutsame Aktion bekommt gestaffeltes
   Feedback (Mikro-Animation < 400 ms, Sound-Slot, ggf. Toast/Vollbild-Moment).
   Keine bedeutsame Aktion endet in einem stummen Zustandswechsel.
7. **Warnung verlinkt Lösung.** Energie gedrosselt → ein Klick führt zur
   Energie-Ansicht mit Handlungsoptionen. Lager voll → ein Klick zu Verkauf/
   Upgrade. Kein Alarm ohne Ausweg.
8. **Ein Interaktionsvokabular überall.** Klick = auswählen, Doppelklick/Enter =
   öffnen, Rechtsklick/Long-Press = Kontextaktionen, Shift = Bereich, Ctrl =
   Multi-Select, Esc = schließen — identisch in Listen, auf der Karte, im Baum.
9. **Mobile ist ein eigenes Layout, kein geschrumpftes.** Gleiche Features,
   eigene Ergonomie: Bottom-Nav, Sheets, Thumb-Zone, reduzierte, nie kastrierte
   Ansichten.
10. **10-Jahre-Regel.** Jeder Screen, jede Navigation, jedes Token-Set wird
    gefragt: „Funktioniert das noch mit 10× Content?" Wenn nein → Aggregations-
    ebene einziehen, bevor das Feature schippt.

## B.3 Auflösung der Konflikte mit bestehender Doku

| Bisherige Festlegung | Neue Festlegung | Zu ändern in |
|---|---|---|
| „SaaS-Dashboard, nicht Fantasy-Game-UI" (06 §3) | Drei-Ebenen-Modell (B.1); Management-Screens behalten SaaS-Präzision, bekommen aber Spiel-Materialität (G.1) | docs/06 §3 → Verweis hierher |
| „Keine begehbare/gerenderte Welt — Gebäude sind Einzelillustrationen" (Art Bible §1.2) | Es gibt eine gerenderte 2.5D-Regionsszene (Teil D.2) — aggregiert, nicht begehbar im 3D-Sinn | Art Bible §1.2 |
| „UI trägt das Spiel, Illustrationen sind Akzente" (Art Bible §1.1) | Region trägt Emotion, UI trägt Kontrolle — gleichberechtigt | Art Bible §1.1 |
| Kühle Slate-Neutrals, Petrol-Primary (Art Bible §2) | Warme Industrie-Palette (G.3): warme Anthrazit-Neutrals, Glut-Orange als Primärakzent, Petrol wird Sekundär | Art Bible §2, styles.css |
| Semi-flat, „keine Verläufe, kein Grunge" (Art Bible §1.1) | Semi-realistisch, leicht stilisiert: weiche Verläufe und Materialtiefe erlaubt, weiterhin keine Comic-Outlines, kein Pixel-Art, kein Low-Poly-Look | Art Bible §1 |
| Navigation: 10 Einträge, Dashboard first (06 §3.1) | Navigation: Spiel-Struktur mit Region first (Teil C) | docs/06 §3.1 |
| Forschung als Tier-Liste, „kein Graph im MVP" (06 §3.5) | Tech-Tree als visueller Graph ist Ziel; Tier-Liste bleibt als Mobile-Fallback und Zwischenschritt legitim | docs/06 §3.5 |

Alle **nicht** genannten Kanon-Regeln (Formeln, Ressourcen, Server-Autorität,
Lazy Production, Client-Zeit-Regel, Store-Architektur) gelten unverändert.

---

# Teil C — Informationsarchitektur

## C.1 Navigation (Zielbild, vollständig)

Primärnavigation in vier semantischen Gruppen (Reihenfolge verbindlich):

```
SPIELWELT            WIRTSCHAFT           GEMEINSCHAFT         SPIELER
─────────            ──────────           ────────────         ───────
Region        [R]    Industrie     [I]    Firmen        [F]    Quests      [Q]
Weltkarte     [W]    Produktion    [P]    Allianz       [A]    Nachrichten [N]
                     Markt         [M]    Rangliste     [L]    Profil      [O]
                     Logistik      [T]
                     Forschung     [E]
                     Inventar      [V]
```

- **Region** = Startscreen nach Login (nicht Dashboard!).
- **Industrie** = Gebäudeverwaltung (Listen/Filter/Mass-Actions, ehem. „Gebäude").
- **Dashboard verschwindet als Ort** — es wird zum **HUD** (Teil D.1), das auf
  jedem Screen präsent ist, plus einem aufklappbaren **Command Center** (D.1.3)
  für die Detail-Widgets.
- Admin bleibt als Route erhalten, erscheint aber nur mit Rolle und außerhalb
  der Spiel-Navigation (Zahnrad im Profil-Menü).
- Eckige Klammern = Desktop-Hotkeys (H.4).

**Sichtbarkeits-Progression (Onboarding-Schutz):** Neue Spieler sehen anfangs
nur Region, Industrie, Forschung, Quests, Profil. Weitere Einträge erscheinen
mit Freischaltung (Markt mit T18, Logistik mit Regionen-Feature, Firmen/Allianz
mit Level-Gate) — jeweils mit „Neu"-Puls auf dem Nav-Icon. Eine Navigation mit
14 toten Einträgen wie heute darf nie wieder vorkommen: **Nicht freigeschaltete
Features sind unsichtbar oder als Teaser markiert („🔒 ab Level 8"), nie leere
Platzhalterseiten.**

## C.2 Screen-Map (vollständig)

```
Login/Register
   │
   ▼
┌──────────────────────────────── SHELL (HUD + Nav + Ticker) ───────────────────────────────┐
│                                                                                            │
│  Region (Start) ──┬── Bezirks-Overlay (Panel über der Szene)                               │
│                   ├── Gebäude-Detail-Overlay (aus Bezirk heraus)                           │
│                   ├── Ereignis-Marker (Quest / Event / Besucher)                           │
│                   └── Regions-Editor (Deko/Layout, Post-MVP)                               │
│                                                                                            │
│  Weltkarte ───────┬── Regions-Popup (fremde Region: Profil, Handel, Allianz)               │
│                   ├── Handelsrouten-Layer                                                  │
│                   └── Allianz-Territorien-Layer                                            │
│                                                                                            │
│  Industrie ───────┬── Bestandsliste (virtualisiert, Filter/Tags/Suche/Gruppierung)         │
│                   ├── Gebäude-Detail (Panel: Rezept, Upgrade, Statistik, Wartung)          │
│                   ├── Mass-Aktionen (Multi-Select-Leiste)                                  │
│                   └── Bau-Katalog (200+ Typen: Kategorien, Suche, Vergleich)               │
│                                                                                            │
│  Produktion ──────┬── Ketten-Übersicht (Ressourcenfluss, Netto-Raten)                      │
│                   ├── Ketten-Detail (Flussdiagramm einer Kette, Engpass-Analyse)           │
│                   └── Energie-Ansicht (Erzeuger/Verbraucher, Throttle-Simulation)          │
│                                                                                            │
│  Markt ───────────┬── Handelsplatz (Orderbuch, Listings, Chart)                            │
│                   ├── Meine Orders │ Historie │ Favoriten                                  │
│                   └── Verträge (Firmen-/Langzeitverträge, Post-MVP)                        │
│                                                                                            │
│  Logistik ────────┬── Routen-Übersicht (Region ↔ Region, Kapazität, ETA)                   │
│                   └── Routen-Editor                                                        │
│                                                                                            │
│  Forschung ───────┬── Tech-Tree (Zoom/Pan-Graph, Desktop) / Tier-Spalten (Mobile)          │
│                   └── Tech-Detail (Panel: Kosten, Effekte, Abhängigkeiten)                 │
│                                                                                            │
│  Inventar ────────── Bestände, Reservierungen, NPC-Handel, Kapazitätsanalyse               │
│                                                                                            │
│  Firmen ──────────┬── Firmenprofil (eigenes/fremdes) ── Mitglieder/Rollen                  │
│                   └── Firmenziele, Firmen-Statistik                                        │
│                                                                                            │
│  Allianz ─────────┬── Allianz-Zentrale (News, Ziele, Diplomatie)                           │
│                   └── Mitglieder, Chat-Einstieg, Gemeinschaftsprojekte                     │
│                                                                                            │
│  Rangliste ───────── Boards (Net Worth / Production / Market) + Firmen-Boards              │
│  Quests ──────────── Questlog (aktiv/abgeschlossen), Events, Daily/Achievements            │
│  Nachrichten ─────── System, Handel, Firma/Allianz, Chat-Threads                           │
│  Profil ──────────── Identität, Statistiken, Einstellungen, Themes, Admin-Zugang           │
│                                                                                            │
│  Overlays (überall): Command Center (HUD-Expand) · Bauqueue · Suche (Ctrl+K) ·             │
│                      Benachrichtigungs-Center · Collect-Moment                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Overlay-Prinzip:** Detailkontexte (Bezirk, Gebäude, Tech, Order) öffnen als
**Panel-Overlay** über dem aktuellen Screen (Desktop: Side-Panel rechts, 480 px;
Mobile: Bottom-Sheet), nie als eigene Route mit hartem Kontextwechsel. Sie sind
URL-adressierbar (`/industry?b=<id>`, `/region?district=industrial`) für Deep-
Links und Back-Button, rendern aber über dem Kontext. So bleibt der Spieler „im
Fluss" und kann Overlay-Inhalte mit dem darunterliegenden Screen vergleichen.

---

# Teil D — Kern-Screens

## D.1 HUD (das neue „Dashboard")

Das HUD ist die permanente Spielinformationsschicht der Shell — auf **jedem**
Screen sichtbar, niemals scrollend.

### D.1.1 Aufbau Desktop

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ⬡ FORGERY   🪙 24.3k ▲  ⚡ 240/310 ⚠77%  🔬 12:41  🏗 2/3 ⏱ 04:12   🔔3  ▾Ressourcen │ ← HUD-Bar (48px)
├──────────┬─────────────────────────────────────────────────────────────────────────┤
│          │                                                                         │
│  Nav-    │                        Screen-Inhalt                                    │
│  Rail    │                                                                         │
│  (72px,  │                                                                         │
│  expand  │                                                                         │
│  240px)  │                                                                         │
│          ├─────────────────────────────────────────────────────────────────────────┤
│          │ ⟨Ticker⟩ Stahlwoche-Event endet in 2d · Markt: Stahl +12% · Mira hat …   │ ← Ticker (28px, abschaltbar)
└──────────┴─────────────────────────────────────────────────────────────────────────┘
```

HUD-Bar-Inhalte, von links nach rechts (Priorität = Reihenfolge, rechts fällt
zuerst weg):

1. **Logo/Home** → Region.
2. **Coins** — live extrapoliert, Delta-Pfeil (Trend letzte Stunde).
3. **Energie-Bilanz** — Erzeugung/Bedarf; bei Throttle: Amber-Puls + Prozent.
   Klick → Energie-Ansicht (Prinzip 7).
4. **Forschungs-Slot** — aktive Tech mit Countdown-Ring; leer = pulsierender
   „Forschen"-Hinweis. Klick → Forschung.
5. **Bauqueue-Slot** — „2/3" mit Countdown des nächsten Abschlusses. Klick →
   Bauqueue-Overlay.
6. **Benachrichtigungen** (Badge) und **Ressourcen-Drawer-Toggle**.

**Ressourcen-Drawer** (▾): klappt unter der HUD-Bar eine einzeilige, horizontal
scrollbare Leiste der wichtigsten Bestände aus (Icon + kompakte Zahl + Trend,
live extrapoliert). Der Spieler **pinnt** selbst, welche Ressourcen dort stehen
(Default: die 6 mit höchstem Durchsatz). Bei 50+ Ressourcenarten zeigt das HUD
nie alle — das ist Aufgabe von Inventar/Produktion.

### D.1.2 Warnungs-Logik

Maximal **eine** aggregierte Warnstufe im HUD (kein Alarm-Weihnachtsbaum):
Der Warn-Chip zeigt das höchstpriore Problem („⚠ 3 Probleme · Energie 77%"),
Klick öffnet die Problemliste im Command Center, jeder Eintrag deep-linkt zur
Lösung. Priorität: Verfall (Lager voll) > Throttle > Input-Mangel > Queue leer >
Forschung leer.

### D.1.3 Command Center (HUD-Expand)

Klick auf Logo-Chevron oder Taste `C`: ein Overlay-Panel (Desktop: von oben,
60% Höhe; Mobile: Fullscreen-Sheet) mit den bisherigen Dashboard-Widgets in
neuer Rolle — **Zusammenfassung, nicht Hauptinhalt**:

- „Während du weg warst" (Offline-Produktion, Verkäufe, abgeschlossene Bauten)
- Problemliste (D.1.2) mit Deep-Links
- Bauqueue + Forschung im Detail
- Marktchancen (3–5 Empfehlungen)
- Daily Reward / Quest-Kurzliste
- Level/XP-Fortschritt

Das Command Center ist der Session-Einstieg für Power-User („Was liegt an?")
und ersetzt die Dashboard-Route vollständig.

## D.2 Region (Herzstück)

### D.2.1 Konzept

Eine **2.5D-isometrische Szene** (gerenderte Canvas/WebGL-Ebene, Teil J.2) zeigt
die Region des Spielers als lebendiges Diorama. Sie ist **Repräsentation, nicht
Simulation**: Die Szene wird aus dem Spielzustand **abgeleitet** (deterministisch,
serverseitig aggregiert), nicht frei bebaut.

**Kompositionsregeln:**

- Die Region besteht aus **Landschafts-Sockel** (Fluss, Küste/Hafen, Hügel, Wald
  — pro Spieler aus einem Seed variiert, damit Regionen unterscheidbar sind) und
  **Bezirks-Plots** (feste Ankerflächen, ~8–14 Stück).
- Jeder Bezirks-Plot visualisiert eine **Gebäudekategorie-Aggregation**, nie
  Einzelinstanzen: Industriebezirk, Bergbaugebiet, Energiebezirk, Forschungs-
  campus, Logistikzentrum/Hafen, Handelsviertel, Agrar-/Rohstoffland, Wohn-/
  Zentrumsplot (Landmark).
- **Bezirks-Stufen:** Die Darstellung eines Plots wechselt in diskreten Stufen
  mit der aggregierten Entwicklung (Summe Level + Anzahl der Kategorie), z. B.
  Industrie: Werkstatt (St. 1) → Fabrikhof (10) → Industriekomplex (50) →
  Megakomplex (100). Pro Bezirk existieren 4–6 Darstellungsstufen als
  vorgefertigte Kompositionen. **Kein Layout-Solver, kein Auto-Städtebau** —
  kuratierte Stufen halten Art-Aufwand und Performance deterministisch.
- **Mengen-Badges** an den Plots: „Sägewerke ×500" erscheint beim Hover/Fokus
  (Desktop) bzw. im Bezirks-Overlay (immer), nicht permanent (Lesbarkeit).
- **Wahrzeichen:** Singletons und Meilensteine (Lagerhaus, erstes Level-10-
  Gebäude, Event-Trophäen, Mega-Projekte) bekommen eigene Landmark-Plots — die
  persönliche Note der Region.

### D.2.2 Leben in der Szene

Ambient-Ebenen (alle abschaltbar, Performance-Budget in Teil I.4/J.2):

- **Tag/Nacht-Zyklus** an Serverzeit gekoppelt (24h-Zyklus; nachts Fenster-
  lichter, warme Straßenlaternen, Glut am Stahlwerk).
- **Wetter** (klar/Wolken/Regen/Schnee saisonal) — rein kosmetisch, dezent.
- **Bewegte Akzente:** 1 Zug auf der Ringbahn, 1–2 Schiffe am Hafen, Rauchfahnen
  an aktiven Industrieplots, Vogelschwarm, Windräder. Feste kleine Zahl von
  Animatoren — unabhängig von der Gebäudeanzahl.
- **Zustands-Kopplung (Kern-Feature):** Die Szene spiegelt die Wirtschaft.
  Energie-Throttle → Rauchfahnen dünner, Lichter flackern gedimmt. Lager voll →
  Kisten stauen sich am Logistikplot. Produktion voll ausgelastet → sattes
  Leben. Die Region ist damit ein **ehrliches Statusinstrument**, nicht nur Deko.

### D.2.3 Interaktion

- **Kamera:** Pan (Drag/Touch), Zoom 3 Stufen (Scroll/Pinch), Home-Taste.
  Kein freies Rotieren (Assets sind fix isometrisch).
- **Klick auf Bezirk** → **Bezirks-Overlay** (Side-Panel): Kategorie-Summen
  (Anzahl, Gesamtrate, Energie, Auslastung), Problemliste des Bezirks, Top-
  Aktionen („Alle Sägewerke +1", „Rezepte prüfen") und der Button **„Im
  Industrie-Screen verwalten"** mit vorgesetztem Kategorie-Filter. Das Overlay
  ist die Brücke Welt → Management; Tiefenverwaltung passiert IMMER im
  Industrie-Screen (Prinzip 1).
- **Klick auf Landmark/Quest-Marker** → Kontext-Overlay (Questtext, Event).
- **Keine Bau-Interaktion auf der Karte.** Bauen startet im Industrie-Screen
  bzw. Katalog; die Region zeigt das Ergebnis (Bauanimation am Plot).

### D.2.4 Wireframe

```
┌─ HUD ──────────────────────────────────────────────────────────────────┐
│ …                                                                      │
├────────────────────────────────────────────────────────────────────────┤
│   ☁      ☀︎                    ⛰⛰⛰            「Quest ❗」               │
│        ┌────────────┐   ┌──────────────┐                              │
│        │ Forschungs-│   │  Bergbau-    │        ~~~~ Fluss ~~~~        │
│        │ campus ◉   │   │  gebiet      │      ┌───────────────┐       │
│        └────────────┘   │  ×214 ⚠      │ ═════│  Hafen /      │═ 🚢   │
│   ┌──────────────────┐  └──────────────┘  🚂  │  Logistik     │       │
│   │  INDUSTRIEBEZIRK │  ┌──────────────┐      └───────────────┘       │
│   │  Stufe 4 ▓▓▓░    │  │ Energie-     │   ┌─────────┐                │
│   │  „Megakomplex"   │  │ bezirk ⚡     │   │Lagerhaus│ ← Landmark     │
│   │  Sägewerke ×500 …│  └──────────────┘   │  L 12   │                │
│   └──────────────────┘                     └─────────┘                │
│                                                                        │
│  [⊕ Zoom] [⊖] [⌂]                    (Bezirk angeklickt → Panel:)  ──▶ │
├────────────────────────────────────────────────────────────────────────┤
│ ⟨Ticker⟩ …                                                             │
└────────────────────────────────────────────────────────────────────────┘

Bezirks-Overlay (Side-Panel rechts, 480px):
┌─ INDUSTRIEBEZIRK · Stufe 4 ─────────────┐
│ 512 Gebäude · +8.4k Wert/h · ⚡ 1.2k/h   │
│ Auslastung ▓▓▓▓▓▓▓░░ 77 % (Energie ⚠)   │
├─────────────────────────────────────────┤
│ Sägewerke        ×500   +10k Brett/h  ▸ │
│ Werkzeugfabriken ×8     +44 Werk./h   ▸ │
│ Stahlwerke       ×4     ⚠ Input fehlt ▸ │
├─────────────────────────────────────────┤
│ ⚠ 2 Probleme im Bezirk            [→]   │
│ [ Im Industrie-Screen verwalten ]       │
└─────────────────────────────────────────┘
```

## D.3 Industrie (Gebäudeverwaltung)

Der Arbeitsplatz für 1000+ Instanzen und 200+ Typen. Vorbilder: EVE-Industry-
Fenster, Factorio-Produktionsstatistik, Sim-Companies-Verwaltung — **nicht**
Karten-Grids.

### D.3.1 Struktur

Zwei Tabs: **Bestand** (eigene Instanzen) · **Katalog** (baubare Typen).

**Bestand — Standardansicht ist gruppiert nach Typ** (die wichtigste
Aggregations-Entscheidung des Screens):

```
┌ Filter: [Kategorie ▾] [Status ▾] [Tag ▾] [Rezept ▾]  🔍 Suche   [Gruppiert|Flach] [▦|☰] ┐
│ Gespeicherte Ansichten: [⚠ Probleme] [Upgrade-fällig] [Neu…]        Slots 412/480      │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ▾ ⚙ Sägewerk                 ×500   Ø L6.2   +10.0k Bretter/h   ⚡2.1k/h   3⚠   [Aktionen▾] │
│    ├ (virtualisierte Zeilen bei Expand)                                                  │
│    ├ #0412 · L8 · planks_hardwood · +51/h · ⚠ Input      [Upgrade] [Rezept] [⋯]          │
│    └ #0413 · L6 · planks_basic    · +32/h · ok           [Upgrade] [Rezept] [⋯]          │
│ ▸ 🔥 Kohlekraftwerk           ×24    Ø L7.0   +6.7k ⚡/h   −1.7k Kohle/h    0⚠            │
│ ▸ 🏭 Werkzeugfabrik           ×8     Ø L4.5   +44 Werkz./h ⚡ 108/h         1⚠            │
│ …                                                                                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ☑ 500 ausgewählt │ [Mass-Upgrade → L7] [Rezept wechseln] [Tag setzen] [Abreißen]  Σ-Kosten │ ← Mass-Bar
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Gruppenzeile** trägt die Masseninformation (Anzahl, Ø-Level, Gesamtrate,
  Energiesumme, Problem-Count) und die **Gruppen-Aktionen** — 90 % der
  Verwaltung passiert hier, ohne je eine Einzelzeile zu öffnen.
- **Flache Ansicht** (Umschalter) für Power-Filterung über alles; immer
  virtualisiert (CDK Virtual Scroll), Server-seitig paginiert/gefiltert ab
  Schwellwert.
- **Tags** (frei vergebbar, z. B. „Kette-Stahl", „Ausbau-2027") + **gespeicherte
  Ansichten** (Filter-Presets) sind die Skalierungswerkzeuge für Jahre.
- **Status-Filter** ist first-class: Probleme (Input fehlt / Lager voll /
  gedrosselt), im Bau, Upgrade sinnvoll (ROI-Heuristik), inaktiv.

### D.3.2 Mass-Aktionen

- Auswahl: Checkbox je Zeile/Gruppe, Shift-Bereich, Ctrl-Einzeln, „Alle
  gefilterten auswählen".
- **Mass-Upgrade-Dialog:** Ziel („+1 Level" | „auf Level X"), Vorschau:
  Gesamtkosten je Ressource (hast/brauchst, rot bei Fehlbestand), Gesamtdauer
  gegen Bauqueue-Slots, neue Gesamtrate. Teilausführung möglich („so viele wie
  bezahlbar, billigste zuerst").
- Mass-Rezeptwechsel, Mass-Tag, Mass-Abriss (mit doppelter Bestätigung).
- Backend-Anforderung (Kanon-Erweiterung nötig): Batch-Endpoints + mehr als
  1 Bauqueue-Slot; UI ist darauf ausgelegt, degradiert aber sauber (Queue-
  Warteschlange mit Reihenfolge, solange Slots begrenzt sind).

### D.3.3 Gebäude-Detail (Overlay-Panel)

Kopf (Illustration, Name, Level, Tags, Bezirk) · Rezept-Sektion (aktiv,
Alternativen, In/Out auf aktuellem Level) · Upgrade (Kosten hast/brauchst,
Dauer, Ratenvorschau, ROI-Angabe „amortisiert in ~3.2h") · Statistik (Lifetime-
Produktion, Sparkline) · Wartung/Status. Prev/Next-Navigation (↑↓) durch die
gefilterte Liste, ohne das Panel zu schließen.

### D.3.4 Katalog (200+ Typen)

- Linke Rail: Kategoriebaum (Rohstoff, Verarbeitung, Fabrik, Energie, Forschung,
  Logistik, Infrastruktur, Spezial …) mit Zählern.
- Hauptfläche: Karten-Grid **innerhalb** der Kategorie (virtuell gescrollt),
  Suche + Filter (Tech verfügbar / bald / gesperrt; Input-/Output-Ressource).
- Karte: Illustration, Name, Kurzrolle („Holz → Bretter"), Kosten, Zeit,
  Tech-Lock mit Link in den Tech-Tree.
- **Vergleichsmodus:** 2–3 Typen pinnen → Vergleichstabelle (Kosten, Rate/Slot,
  Energie-Effizienz, Kette).
- Empfehlungs-Slot „Für deine Ketten sinnvoll" (heuristisch: fehlende Inputs).

## D.4 Produktion

Die Denk-Ansicht der Wirtschaft: Flüsse statt Listen.

- **Übersicht:** Tabelle aller Ressourcen (virtuell): erzeugt/h, verbraucht/h,
  netto/h, Bestand-Reichweite („Lager voll in 3.1h" / „leer in 40min"),
  Engpass-Ampel. Klick auf Ressource → Ketten-Detail.
- **Ketten-Detail:** horizontales Flussdiagramm (gerichteter Graph, ECharts
  Graph/Sankey oder eigenes SVG) der Produktionskette der gewählten Ressource:
  Knoten = Gebäudegruppe (nie Einzelinstanz!), Kanten = Stofffluss/h,
  Engpasskante rot, Überschusskante gedimmt. Knoten-Klick → Industrie-Screen
  mit Filter. „Was-wäre-wenn"-Regler (Post-MVP): +n Gebäude einer Gruppe
  simulieren (rein clientseitige Vorschau auf Basis der Kanon-Formeln).
- **Energie-Ansicht:** Erzeuger- vs. Verbraucher-Balken, Throttle-Verlauf
  (24h-Chart), Liste größter Verbraucher, Simulations-Hinweis („+2 Kraftwerke
  L5 ⇒ 100%").

```
Stahl-Kette                                                    netto +18 Stahl/h
[Eisenmine ×12]──40/h──▶┌─────────────┐
[Kohle ×6]────18/h────▶│ Stahlwerk ×4 │──44/h──▶[Werkzeugfabrik ×8]──▶ …
     ⚠ Kohle-Engpass    └─────────────┘              │
        −6/h fehlen                                  └─▶ Markt-Verkauf 12/h
```

## D.5 Markt

Professionelles Trading-Interface (EVE-Referenz), bewusst „Terminal"-artig —
hier ist Dichte ein Feature.

```
┌ 🔍 Ressource…  [Favoriten ★] [Alle ▾]        Tabs: [Handel] [Meine Orders] [Historie] [Verträge] ┐
├───────────────┬──────────────────────────────────────────┬───────────────────────────────────────┤
│ ★ Stahl  10.2 │  STAHL          Ref 10.0 · Spanne 8.4–12 │  Chart (ECharts): 24h/7d/30d/1y       │
│ ★ Kohle   2.1 │ ┌─ Verkauf (Asks) ────────────────────┐  │  Preis + Volumen + Ref-Linie          │
│   Bretter 3.4 │ │ 8.4 ×240 │ 9.1 ×80 │ 11.8 ×500 …    │  │  Leitplanken 0.25×/4× markiert        │
│   Eisen   3.1 │ ├─ Kauf (Bids) ───────────────────────┤  │                                       │
│   …           │ │ 8.1 ×1.2k │ 7.9 ×400 │ …            │  ├───────────────────────────────────────┤
│ (virtuell)    │ └──────────────────────────────────────┘  │  Kaufen ▸ Menge [   ] Preis [   ]     │
│               │  Depth-Balken hinter den Zeilen           │  Gebühr 5% · Σ 2 040 C   [Order]      │
├───────────────┴──────────────────────────────────────────┴───────────────────────────────────────┤
│ Meine Orders (12/30): Tabelle mit Restlaufzeit, Teilfüllung, [Cancel]                             │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Linke Rail: Ressourcen-Watchlist (Favoriten pinnbar, Mini-Trend).
- Mitte: Orderbuch beidseitig mit Tiefen-Visualisierung; Klick auf Orderzeile
  füllt das Order-Formular vor (Teilkauf).
- Rechts: Chart (dataZoom, Referenzpreis-markLine, Leitplanken) + Order-Formular
  mit Gebühren-/Erlösvorschau und Leitplanken-Validierung.
- **Historie:** eigene Trades + Markt-Zeitreihe; **Favoriten** + Preis-Alarme
  („benachrichtige mich unter 8.0") — Langzeit-Bindungs-Feature.
- **Verträge** (Post-MVP): Direkthandel, Firmenverträge, wiederkehrende
  Lieferverträge — eigener Tab, gleiche Formensprache.
- Markt gesperrt (vor T18): Teaser-Screen mit Chart-Silhouette und CTA
  „Marktlizenz erforschen" (deep-link) — kein leerer Platzhalter.

## D.6 Forschung

- **Desktop: echter Tech-Tree-Graph.** Horizontales Zoom/Pan-Canvas (gleiches
  Interaktionsvokabular wie Region/Weltkarte), Knoten = Tech-Karte (Icon, Name,
  FP, Dauer, Status), Kanten = Abhängigkeiten. Status-Färbung: erforscht
  (gefüllt) / verfügbar (Puls-Rand) / gesperrt (gedimmt, Kette zur fehlenden
  Voraussetzung highlightet on hover). Bei 20 Techs bereits wertvoll, bei 200
  unverzichtbar — der Graph ist die Zukunftssicherung. Cluster-Gruppierung nach
  Domäne (Holz, Metall, Energie, Logistik, Handel, Wissenschaft) mit
  Hintergrund-Zonen.
- **Mobile: Tier-/Domänen-Spaltenliste** (die bestehende 06 §3.5-Idee) als
  vollwertige Alternative, kein Kompromiss-Graph auf 5-Zoll.
- Kopf: FP-Bestand + FP-Rate, aktiver Forschungs-Slot mit Countdown-Ring.
- Tech-Detail-Panel: Effekte konkret quantifiziert („+25 % Lagerkapazität ⇒
  12.4k → 15.5k"), Was-schaltet-das-frei-Vorschau (Gebäude/Rezepte mit Bildern),
  „Pfad hierhin" (fehlende Vorforschungen als Queue-Vorschlag).
- Forschung-fertig-Moment: HUD-Puls + Toast mit Tech-Illustration; im Tree
  füllt sich der Knoten mit Aufleuchten (Teil I).

## D.7 Logistik (Post-MVP-Roadmap 4.0, UI-Konzept jetzt)

- **Routen-Übersicht:** Tabelle Region ↔ Region: Kapazität/h, Auslastung,
  Laufzeit, transportierte Güter, Kosten. Ampel für Engpässe.
- **Routen-Editor:** Quelle/Ziel (aus Weltkarte oder Dropdown), Güter-Zuordnung
  mit Prioritäten, Kapazitätsplanung mit Vorschau.
- Sichtbare Kopplung: Routen erscheinen als animierte Linien auf der Weltkarte
  und als Züge/Schiffe in der Region (dieselben Ambient-Animatoren, D.2.2).
- Bis dahin: Nav-Eintrag unsichtbar (C.1 Progression).

## D.8 Firmen

- **Firmenprofil:** Emblem (geometrisches Industrie-Emblem-System, Art Bible
  §3.4-Sprache), Name, Motto, Gründung, aggregierte Kennzahlen (Net Worth,
  Production Score, Mitglieder), Trophäen-Leiste.
- **Mitglieder & Rollen:** Tabelle (virtuell) mit Rolle (Inhaber/Direktor/
  Mitglied), Beitrag (Woche/Lifetime), Online-Status; Rollen-Verwaltung als
  Kontextaktion.
- **Firmenziele:** Karten mit Fortschrittsbalken (gemeinsame Ziele → kosmetische
  Rewards, Roadmap 2.0), Beitrags-Breakdown.
- Fremde Firmenprofile: gleiche Ansicht read-only + „Bewerben"-CTA.

## D.9 Allianz

Allianz = Verbund von Firmen (Clan-Ebene). Eigene Zentrale:

- **Zentrale:** Allianz-Banner, News-Feed (Offiziers-Posts + Systemereignisse),
  Diplomatie-Status (Partner/Neutral/Rivale — Basis für spätere Mechaniken),
  Gemeinschaftsprojekte (Mega-Projekte, Roadmap 5.0+) mit Beitrags-Leaderboard.
- **Mitglieder:** Firmenliste mit Kennzahlen.
- **Chat-Einstieg:** Allianz-/Firmen-Chat öffnet als andockbares Panel (rechts
  unten, wie Handels-Terminals), nicht als eigene Route — Chat begleitet das
  Spielen. (Chat-Backend Roadmap 2.0.)

## D.10 Weltkarte

Die soziale Landkarte des MMO — andere Maßstabsebene als die Region:

- **Darstellung:** stilisierte Kontinentkarte (Canvas, gleiche Engine wie
  Region, eigene Asset-Ebene), Regionen anderer Spieler als Siedlungs-Marker,
  deren Größe/Glow den Entwicklungsstand aggregiert (LOD: bei Rauszoomen
  Cluster-Punkte → Heatmap).
- **Layer-Toggles:** Allianz-Territorien (Farbflächen), Handelsrouten
  (animierte Linien), Markt-Aktivität (Heatmap), Events (Marker).
- **Interaktion:** Klick auf fremde Region → Popup (Spieler-/Firmenprofil,
  Rangdaten, „Handeln"-CTA → Markt gefiltert, „Nachricht"). Eigene Region →
  „Betreten" (Wechsel in D.2).
- Suche (Spieler/Firma/Allianz) + „Zu meiner Region" als fixe Aktion.
- MVP-Vorstufe: Auch bevor es echte Regionen-Geografie gibt, funktioniert die
  Weltkarte als **soziale Visualisierung** (Marker aus Leaderboard-Daten) —
  billig, aber MMO-Gefühl ab Tag 1.

## D.11 Sekundär-Screens (kompakt)

- **Inventar:** virtuelle Tabelle amount/reserved/capacity mit Kapazitätsbalken,
  Kategorie-Filter; NPC-Verkauf (60 %) / Notkauf (140 %) als Zeilenaktion mit
  Mengen-Slider; Kapazitätsanalyse-Kopf („Lagerhaus-Upgrade lohnt: 3 Ressourcen
  > 90 %" → Deep-Link).
- **Quests & Events:** Questlog (aktiv, mit Fortschritt und Claim), Event-Karten
  mit Countdown (LiveOps 3.0), Daily-Streak-Leiste, Achievements-Grid. Quests
  sind auch der Onboarding-Träger (Teil E.1).
- **Nachrichten:** Ordner (System, Handel, Firma, Allianz, Direkt), Threads;
  Systemnachrichten mit Deep-Link-Aktionen („Order ausgelaufen → neu einstellen").
- **Rangliste:** Boards als Tabs (Spieler + Firmen), eigene Zeile sticky,
  Zeitraum-Umschalter, Klick auf Spieler → Weltkarten-Popup (D.10).
- **Profil:** Avatar + Rahmen, Level/XP, Lifetime-Statistiken (Charts),
  Themes/Einstellungen (Animations-Reduktion, Ticker aus, Ressourcen-Pins),
  Admin-Zugang (Rolle).

---

# Teil E — UX-Flows

## E.1 Onboarding (kritischster Flow)

```
Registrierung → Regions-Reveal (Kamerafahrt über die leere Region, Name taufen)
→ Quest 1 „Erster Holzfäller" (Quest-Marker → Katalog vorgefiltert → Bauen
→ zurück in Region: Bauanimation, 30s-Countdown sichtbar am Plot)
→ Quest 2 „Erste Ernte" (Collect-Moment mit Zähler-Animation)
→ Quest 3 Steinbruch/Wasserpumpe → Quest 4 Forschungslabor + erste Tech
→ ab hier: Questlog übernimmt, Nav-Einträge schalten sich mit Relevanz frei (C.1)
```

Regeln: Nie mehr als 1 neues UI-Konzept pro Quest-Schritt; jeder Schritt endet
mit sichtbarer Veränderung in der Region; Skip für Wiederkehrer.

## E.2 Tägliche Session (Ziel: 5–15 min befriedigend)

```
Login → Region lädt → „Während du weg warst"-Sheet (Produktion, Verkäufe,
fertige Bauten/Forschung, Daily-Reward-Claim) → Collect-Moment
→ Problemliste (falls ⚠): je 1 Klick zur Lösung
→ Entscheidungen: Bauqueue füllen, Forschung anstoßen, Orders prüfen
→ optional Kür: Markt-Chancen, Ketten-Optimierung, Firma/Allianz
→ Logout-sicher: alles Server-seitig, kein „Verlassen?"-Dialog nötig
```

## E.3 Bauen & Upgraden

```
Einstieg A: Industrie → Katalog → Typ → [Bauen n×] → Queue-Vorschau → bestätigen
Einstieg B: Produktion → Engpass-Knoten → „+Gebäude" (vorgefilterter Katalog)
Einstieg C: Region → Bezirk → „Verwalten" → Gruppe → [Mass-Upgrade]
→ Queue-Overlay zeigt Reihenfolge/Countdowns; Abschluss: HUD-Puls + Regions-Plot-Update
```

## E.4 Handel

```
Markt → Ressource (Suche/Watchlist) → Orderbuch-Zeile klick (Formular vorgefüllt)
→ Menge/Preis (Leitplanken-Validierung live, Gebühr/Erlös-Vorschau)
→ bestätigen → Toast + „Meine Orders"-Badge · Teilfüllungen als Nachricht mit Deep-Link
Verkauf aus Inventar: Zeile → „Verkaufen" → gleicher Order-Dialog, Menge ≤ frei
```

## E.5 Forschung

```
Forschung → Tree → verfügbarer Knoten (Puls) → Detail-Panel → [Forschen]
Gesperrter Wunsch-Knoten → „Pfad hierhin" → Vorforschungs-Kette als Merkliste
Fertig (auch offline) → nächste Session: „Während du weg warst" + Tree-Aufleuchten
```

## E.6 Problem → Lösung (Prinzip 7, überall identisch)

```
HUD ⚠ → Problemliste → Eintrag „Lager voll: Holz (Verfall!)"
→ [Verkaufen] (Markt-Order vorgefüllt) | [NPC-Verkauf] (Inventar-Dialog)
| [Lagerhaus ausbauen] (Gebäude-Detail) | [Produktion drosseln] (Rezept/Gruppe)
```

---

# Teil F — Plattform-UX

## F.1 Desktop (≥ 1024 px)

- **Layout:** Nav-Rail links (72 px, expandierbar 240 px, Zustand persistiert),
  HUD-Bar oben (48 px), Ticker unten (28 px, abschaltbar), Inhalt füllt den Rest
  — **volle Breite** (kein `max-w-6xl` mehr); innere Spalten-Layouts begrenzen
  Zeilenlängen wo nötig (Lesetext max ~72ch, Tabellen/Canvas voll).
- **Side-Panels** (Overlays, C.2) docken rechts, 480 px, resizable; zwei Panels
  stapelbar (z. B. Gebäudegruppe + Einzelgebäude).
- **Hotkeys** (H.4) + `Ctrl+K`-Universalsuche (Ressourcen, Gebäude, Techs,
  Spieler, Screens) — das Power-User-Rückgrat.
- Multi-Monitor-freundlich: Markt und Region funktionieren in eigenen Tabs
  (URLs erster Klasse).

## F.2 Mobile (< 1024 px)

- **Bottom-Nav, 5 Slots:** `Region · Industrie · Markt · Quests · Mehr` —
  „Mehr" = Sheet mit allen weiteren Zielen (Badges dort sichtbar aggregiert).
  Slot-Belegung kann sich mit Progression ändern (vor T18 statt Markt:
  Forschung).
- **HUD mobil:** einzeilig (Coins, Energie, ⚠-Chip, 🔔); Ressourcen-Drawer als
  Pull-Down; Ticker entfällt (Inhalte wandern ins Benachrichtigungs-Center).
- **Alle Overlays = Bottom-Sheets** (halb → voll expandierbar, Drag-Handle).
- **Region mobil:** volle Szene mit Pinch/Pan, reduzierte Ambient-Stufe
  (Teil J.2); Bezirks-Tap → Sheet.
- **Listen mobil:** Gruppenzeilen als Karten, Zeilenaktionen per Swipe
  (links: primär z. B. Upgrade; rechts: Menü), Multi-Select über Long-Press
  → Auswahlmodus mit Aktionsleiste unten.
- **Markt mobil:** gestapelte Reihenfolge Chart → Orderbuch → Formular;
  Watchlist als horizontale Chip-Leiste.
- **Tech-Tree mobil:** Domänen-Spaltenliste (D.6).
- Touch-Ziele ≥ 44×44 px, primäre Aktionen in der Thumb-Zone (untere 40 %).
- PWA bleibt (docs/06 §5); Push-Benachrichtigungen (Bau fertig, Order gefüllt,
  Angriff auf Allianzprojekt) als Langfrist-Bindung, opt-in, im Profil granular.

## F.3 Tablet / Zwischenbreiten

1024–1280 px: Desktop-Layout mit collapsed Rail und einspaltigen Panels.
Side-Panels dürfen den Inhalt überlagern statt zu schieben.

---

# Teil G — Designsystem

## G.1 Artstyle-Evolution („Warm Industrial")

Von „SaaS mit Illustrations-Akzenten" zu **„modernes AAA-Browsergame,
semi-realistisch, leicht stilisiert, warm, industriell"**:

- **Semi-realistisch, leicht stilisiert:** Proportionen leicht idealisiert,
  Materialien lesbar (Backstein, Stahl, Kupfer, Holz), weiche globale
  Beleuchtung, dezente Verläufe und Ambient-Occlusion-Schatten erlaubt.
  Weiterhin verboten: Comic-Outlines, Pixel-Art, sichtbare Low-Poly-Facetten,
  Fotocollagen, düsterer Rust-Belt-Grunge.
- **Warme Grundstimmung:** goldene Stunde als Standard-Lichtstimmung der Region;
  UI-Neutrals warm-anthrazit statt kühl-slate; Glut/Amber als Lebenszeichen der
  Industrie.
- **Fantasy minimal:** keine Magie/Mittelalter; erlaubt sind „Wunder-Bauwerke"
  als Mega-Projekte mit leicht überhöhter Silhouette.
- **Isometrie bleibt verbindlich** (2:1, 30°, Licht 45° oben links — Art Bible
  §3 gilt weiter), damit vorhandene und künftige Assets kompatibel sind. Die
  Art Bible wird um Bezirks-Kompositionen, Landschafts-Tiles, Ambient-Sprites
  und die warme Palette erweitert; Icon-/Silhouetten-Disziplin (32-px-Test)
  bleibt Gesetz.
- **Zwei Material-Welten, eine Familie:** Regions-Szene = voll illustrativ;
  Management-UI = ruhige Flächen mit *Materialität in Mikrodosen* (Panel-Kanten
  mit 1-px-Highlight wie gebürstetes Metall, dezente Blueprint-Pattern in
  Empty States, warme Glows für aktive Zustände). Die UI zitiert die Welt,
  ohne sie zu imitieren — Zahlen bleiben der Star der Management-Ebene.

## G.2 Design-Token-Architektur

Drei Schichten, als CSS Custom Properties + Tailwind-Theme (Erweiterung des
bestehenden Ansatzes in `styles.css`):

```
1. Primitive Tokens   --color-ember-500, --color-coal-900, --space-4, --dur-fast
2. Semantische Tokens --bg, --surface, --text, --primary, --warning, --res-raw …
3. Komponenten-Tokens --hud-height, --panel-width, --card-radius, --nav-rail-w
```

Themes (Dark Warm = Default, Light, Belohnungs-Themes) ändern ausschließlich
Schicht 2. Schicht 1 ist stabil, Schicht 3 referenziert nur Schicht 2.

## G.3 Farb-Token (Zielpalette „Warm Industrial", Dark = Default)

| Token | Dark (Default) | Light | Verwendung |
|---|---|---|---|
| `--bg` | `#151210` (warmes Kohle-Schwarz) | `#F7F4F0` | App-Hintergrund |
| `--bg-scene` | Szene selbst (Himmel/Boden) | — | Region/Weltkarte-Canvas |
| `--surface` | `#1F1B17` | `#FFFFFF` | Panels, Karten |
| `--surface-2` | `#2A241E` | `#F0EBE4` | Hover, Zeilen, Vertiefungen |
| `--surface-3` | `#352E26` | `#E6DFD6` | Modals, Dropdowns |
| `--border` | `#3D352B` | `#DDD4C8` | Rahmen, Divider |
| `--border-accent` | `#54483A` | `#C9BCAB` | Panel-Kanten-Highlight |
| `--text` | `#F2EAE0` | `#221C15` | Primärtext |
| `--text-muted` | `#A99F91` | `#6E6355` | Sekundärtext |
| `--primary` | `#E8842C` (Glut-Orange) | `#C4661A` | Aktionen, aktive Nav, CTAs |
| `--primary-hover` | `#F59B4A` | `#A85512` | Hover/Fokus |
| `--secondary` | `#2C8C96` (Industrie-Petrol) | `#1F6E77` | Links, Sekundäraktionen, Info |
| `--gold` | `#E9B44C` | `#B98A2E` | Coins, Premium, Belohnung |
| `--energy` | `#F5C542` | `#C79A1F` | exklusiv Energie |
| `--science` | `#4CC9E8` | `#1D93B5` | exklusiv Forschung/FP |
| `--success` | `#7CB86A` | `#4E8A3E` | positive Raten, ok |
| `--warning` | `#E8A23C` | `#B57718` | Throttle, Lager > 90 % |
| `--danger` | `#D95B4A` | `#B5372A` | Verfall, Fehler, destruktiv |

Kategorie-/Signaturfarben (Charts, Badges, Icons) — warme Anpassung der Art
Bible §2.3: Roh `#A16E32`, T2 `#8A8F98`, T3/T4 `#9B6BD9` (+ Cyan-Sekundär),
Spezial `--energy`/`--science`. Seltenheits-/Qualitätsskala (für spätere Skins,
Rahmen, Event-Items): Common Grau → Uncommon Grün → Rare Petrol → Epic Violett
→ Legendary Gold — einmal definiert, überall identisch.

Regeln: `--primary` (Glut) exklusiv für Interaktion/CTA, nie Deko. `--gold`
exklusiv für Werte/Belohnung. WCAG AA (≥ 4.5:1 Text, ≥ 3:1 UI-Grafik) in beiden
Modi bleibt Pflicht; Statusfarben werden immer mit Icon/Text doppelt kodiert
(Farbenblindheit).

## G.4 Typografie

| Rolle | Font | Einsatz |
|---|---|---|
| Display | **Industrie-Grotesk mit Charakter** (z. B. „Archivo"/„Saira Semi Condensed"-Klasse; final per Font-Audit) | Screen-Titel, Zahlen-Momente, Level-Up, Bezirksnamen |
| UI/Body | Inter (bleibt) | Fließtext, Labels, Tabellen |
| Mono/Zahlen | Inter `tabular-nums` (bleibt); optional „JetBrains Mono"-Klasse im Markt-Terminal | Countdowns, Preise, Orderbuch |

Skala (rem, Basis 16): 12 / 13 / 14 (Body) / 16 / 18 / 22 / 28 / 36 / 48.
Zahlen immer tabular. Display-Font sparsam — er ist das „Spiel-Gewürz", nicht
die Brotschrift.

## G.5 Form, Tiefe, Ikonografie

- Radius: Karten 12 px (`--card-radius`), Controls 8 px, Chips/Badges voll.
- Tiefe im Dark Mode über Flächenhelligkeit + 1-px-Kanten-Highlight
  (`--border-accent` oben/links = Lichtkante), Schatten nur für schwebende
  Ebenen (Dropdown, Modal, Drag).
- **Icon-System (Emoji-Verbot):** UI-Icons als Stroke-Set (24-px-Grid, Art
  Bible §3.3) via SVG-Sprite; Ressourcen-/Gebäude-Icons als illustrierte
  SVG-Assets (`iconKey`). Emoji sind ab sofort in Produkt-UI unzulässig.

## G.6 Komponentenbibliothek

Basis-Strategie bleibt (docs/06 §4.3): **PrimeNG für datenintensive Primitives
(Table-Kern, Overlay-Mechanik, Select), Tailwind für Layout, ECharts für
Charts** — plus eine eigene **Forgery-Game-UI-Schicht** (`shared/ui`), die als
einzige Import-Quelle für Feature-Code dient (PrimeNG wird gewrappt, nie roh
in Features benutzt — Austauschbarkeit über 10 Jahre):

**Layout & Shell:** `HudBar`, `ResourceDrawer`, `NavRail`, `BottomNav`,
`NewsTicker`, `SidePanel` (Desktop-Overlay), `BottomSheet`, `CommandCenter`.

**Daten & Masse:** `VirtualTable` (CDK Virtual Scroll + Gruppierungszeilen),
`GroupRow`, `MassActionBar`, `FilterBar` (+ `SavedViews`), `TagChip`,
`CompareTray`.

**Spiel-Semantik:** `ResourceIcon`, `ResourceAmount` (Icon + kompakte Zahl +
Trend, live extrapoliert), `RateBadge` (+/− pro h), `CapacityBar`,
`CountdownRing`/`CountdownBadge` (Serverzeit-Offset), `CostList`
(hast/brauchst), `LevelBadge`, `StatusDot` (ok/warn/error mit Icon),
`BuildingCard`, `TechNode`, `DistrictPanel`, `ProblemList`, `QuestCard`,
`StreakBar`, `PlayerTag` (Name + Firma + Allianz-Emblem), `EmblemAvatar`.

**Markt:** `OrderBook`, `DepthBar`, `PriceChart` (ECharts-Wrapper),
`OrderForm`, `Watchlist`, `TradeRow`.

**Feedback:** `Toast`-Host, `RewardMoment` (Collect/Level-Up-Overlay),
`Skeleton`-Familie, `EmptyState` (illustriert, mit CTA), `ErrorState`
(Retry), `ConfirmDialog` (destruktiv rot, Kosten-Vorschau).

**Canvas-Schicht (kein DOM):** `SceneViewport` (Pan/Zoom-Wrapper),
`RegionScene`, `WorldMapScene`, `TechTreeGraph`, `ChainFlowGraph` — gemeinsame
Interaktions-Gesten, gemeinsames Kamera-Modell (Teil J.2).

Jede Komponente wird mit Dark/Light, Desktop/Mobile, Loading/Empty/Error und
`prefers-reduced-motion`-Zustand definiert (Storybook o. ä. als lebender
Katalog).

---

# Teil H — Interaction Guidelines

## H.1 Grundvokabular (überall identisch, Prinzip 8)

| Geste | Desktop | Mobile | Bedeutung |
|---|---|---|---|
| Primär | Klick | Tap | Auswählen / Fokussieren |
| Öffnen | Doppelklick oder Enter | Tap auf Fokussiertes / Chevron | Detail-Panel |
| Kontext | Rechtsklick | Long-Press | Kontextmenü (max. 7 Einträge) |
| Multi-Select | Ctrl-Klick, Shift-Bereich, Checkbox | Long-Press → Auswahlmodus | Massenaktionen |
| Schließen | Esc / Klick außerhalb | Swipe-down / ✕ | Panel/Sheet zu |
| Kamera | Drag-Pan, Scroll-Zoom | Pan, Pinch | alle Canvas-Szenen gleich |

## H.2 Zustands- & Feedback-Regeln

- **Latenz-Stufen:** < 100 ms UI-Reaktion immer (Pressed-State sofort);
  100–1000 ms: Button-Spinner inline; > 1 s: Skeleton/Progress; nie
  Vollbild-Blocker für Einzelaktionen.
- **Server-autoritativ, ehrlich optimistisch:** Aktionen zeigen sofort
  „pending" (Button-State, Zeile gedimmt), committen visuell erst mit
  Server-Antwort. Keine clientseitige Vorwegnahme von Beständen (docs/06 §6).
- **Fehler:** inline am Ort der Aktion (Feld/Zeile), Toast nur für
  kontextlose/asynchrone Fehler; jeder Fehlertext sagt, was zu tun ist.
- **Disabled erklärt sich:** deaktivierte Aktionen tragen Tooltip/Untertext
  mit Grund + Link („Queue voll — Slot in 04:12 frei").
- **Destruktiv:** rot, ConfirmDialog mit Konsequenz-Vorschau; Mass-Abriss
  zusätzlich mit Zahleingabe der Anzahl. Kein Undo-Versprechen, das der
  Server nicht hält.

## H.3 Formulare & Zahlen

- Mengen-Eingaben immer mit Max-Button, Slider ab Wertebereichen > 100,
  Stepper für kleine Bereiche; Validierung live (Leitplanken, Bestände).
- Kompakt-Notation (`12.4k`) in Listen, exakte Zahl im Tooltip/Detail;
  Eingabefelder akzeptieren `12k`/`1.5m`.
- Kosten immer als `CostList` mit hast/brauchst-Färbung, nie als Fließtext.

## H.4 Tastatur & Zugänglichkeit

- Hotkeys: Screens (C.1-Buchstaben), `C` Command Center, `Ctrl+K` Suche,
  `Esc` schließt oberste Ebene, `↑↓` Listen-Navigation, `Space` Auswahl,
  `Enter` öffnen. Einstellbar/abschaltbar; keine Hotkeys in Eingabefeldern.
- Vollständige Tastatur-Bedienbarkeit der Management-Ebene; Canvas-Szenen mit
  Fokus-Ring-Navigation über Bezirke/Knoten (Pfeiltasten) + Screenreader-
  Alternativliste („Bezirke als Liste anzeigen").
- Fokus sichtbar (2 px `--secondary`-Ring), Reihenfolge logisch, Panels als
  Fokus-Fallen mit Rückgabe.
- `prefers-reduced-motion` respektiert jede Animation (I.5); Farbenblind-
  Doppelkodierung (G.3); Schriftgrößen skalieren mit Browser-Zoom bis 200 %.

## H.5 Benachrichtigungs-Etikette

In-Session: Toast (max. 3 gestapelt, 5 s, hover-persistent) nur für
asynchrone Ereignisse; alles landet zusätzlich im Benachrichtigungs-Center
(🔔, gruppiert nach Typ, mit Deep-Links). Zwischen Sessions: „Während du weg
warst" bündelt; Push (mobil, opt-in) nur für explizit abonnierte Ereignisse.
Niemals Modal-Interrupts für Werbung/Events — Events leben in Ticker + Quests.

---

# Teil I — Animation Guidelines

## I.1 Motion-Prinzipien

1. **Zweck vor Schmuck:** Jede Animation erklärt Herkunft/Ziel (räumliche
   Kontinuität), quittiert eine Aktion oder zeigt Systemzustand. Reine Deko
   nur in der Ambient-Ebene der Szene.
2. **Schnell in der Verwaltung, ruhig in der Welt:** Management-UI reagiert
   knackig (90–250 ms), die Region atmet langsam (Sekunden bis Minuten).
3. **Nie blockieren:** Keine Animation verzögert Input; Skip bei erneutem
   Klick; Belohnungsmomente sind abbrechbar.

## I.2 Token

```
--dur-instant: 90ms    Hover, Pressed, Toggle
--dur-fast:   150ms    Chips, Badges, kleine Fades
--dur-base:   250ms    Panels, Sheets, Tabs, Listen-Deltas
--dur-slow:   400ms    Overlays, Command Center, Szenen-Fokusfahrt
--dur-moment: 900ms    Reward-Momente (Collect, Level-Up), Tech-Aufleuchten
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1)     Standard (eintretend)
--ease-in:     cubic-bezier(0.7, 0, 0.84, 0)     austretend
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) Belohnung/Betonung, sparsam
```

Nur `transform` + `opacity` animieren (Compositor); niemals layoutwirksame
Properties in Listen.

## I.3 Standard-Choreografien

- **Panel/Sheet:** Slide + Fade (`--dur-base`), Hintergrund dimmt 40 %.
- **Zahlen-Änderung:** Count-up/down (`--dur-base`), Delta-Chip (+124) steigt
  auf und verblasst (`--dur-fast` + 800 ms Standzeit).
- **Countdown-Abschluss:** Ring füllt sich, dann `--ease-spring`-Puls +
  Farbwechsel auf `--success`.
- **Collect-Moment:** Ressourcen-Icons fliegen gebündelt zum HUD-Bestand
  (max. 5 Partikel-Gruppen, nicht n Items), Zähler tickt hoch, dezenter
  Glow — gesamt < 1.2 s, klickbar-abbrechbar.
- **Level-Up / Tech fertig:** Vollflächen-Moment (Vignette + Display-Font +
  Belohnungszeile), `--dur-moment`, Tap-to-dismiss.
- **Listen-Updates (Polling):** neue/geänderte Zeilen mit 1.5 s Hintergrund-
  Highlight-Fade, nie Reflow-Springen (stabile Sortierung, Höhen fix).

## I.4 Ambient-Budget (Region/Weltkarte)

- Ziel 60 fps Desktop / 30 fps Mobile-Low; harte Obergrenze **~24 aktive
  Animatoren** pro Szene (Züge, Schiffe, Rauch-Emitter, Vögel, Wasser-Shader
  zählen je 1) — unabhängig von Gebäudezahl (Prinzip 3).
- Drei Ambient-Stufen: Voll (Desktop) / Reduziert (Mobile/Tablet: halbe
  Animatoren, kein Wetter-Partikel) / Statisch (Low-Power, `reduced-motion`,
  Hintergrund-Tab: Szene friert als Standbild mit Tag/Nacht-Färbung ein).
- Alles pausiert bei `document.hidden` (auch CSS-Loops via Klasse).

## I.5 Reduced Motion

`prefers-reduced-motion: reduce` ⇒ Transforms → reine Fades (`--dur-fast`),
Count-ups → Sofortwert mit Delta-Chip, Ambient → Statisch, Reward-Momente →
kompakte Toast-Variante. Zusätzlich als App-Einstellung unabhängig vom OS.

---

# Teil J — Performance-Architektur

## J.1 Datenpfad (nichts wächst linear mit n — API-seitig)

- **Aggregat-Endpoints als Standard:** Gebäude-Gruppen-Summen (je Typ:
  Anzahl, Ø-Level, Raten, Probleme), Bezirks-Summen, Ketten-Summen,
  Ressourcen-Raten — die UI fordert Einzelinstanzen nur für den sichtbaren
  Ausschnitt an (server-seitige Pagination + Filter ab ~200 Instanzen).
  (Kanon-/API-Erweiterung erforderlich — Ticket-Paket in Teil K.)
- **Polling-Hierarchie** (erweitert docs/06 §7): HUD-Puls 30 s (ein leichter
  Summary-Call: Coins, Energie, Queue, ⚠-Count) · aktiver Screen eigenes
  Intervall (Markt 15 s) · inaktive Screens nichts · `document.hidden`
  pausiert alles. Countdown-Ablauf triggert gezielten Refresh. WebSocket/SSE
  bleibt Post-MVP-Kandidat (Markt-Ticker, Chat) — die UI ist so gebaut, dass
  nur die Datenquelle wechselt.
- Client-Extrapolation nur Anzeige (Bestand + Rate × Δt), Cap am
  Kapazitätslimit, Server-Antwort überschreibt hart.

## J.2 Render-Pfad

- **DOM-Ebene:** Virtual Scroll für jede Liste > 50 Zeilen; stabile
  Zeilenhöhen; `@defer` für Below-the-fold (Charts, Achievements);
  OnPush + Signals (bleibt).
- **Canvas-Ebene (Region, Weltkarte, Tech-Tree, Ketten-Graph):** eine
  WebGL-2D-Engine (PixiJS-Klasse; finale Wahl per Spike) hinter einer
  eigenen `SceneViewport`-Abstraktion — Angular hält Zustand/Overlays (DOM),
  die Szene rendert Sprites. Sprite-Atlanten pro Bezirks-Stufe; Kamera-Culling;
  LOD (Zoom-out: Bezirks-Impostor statt Detail-Komposition; Weltkarte:
  Marker → Cluster → Heatmap); Ambient-Budget (I.4). Die Szene lädt lazy
  (Route-Level), Management-Screens bleiben davon unberührt.
- **Asset-Pipeline:** SVG-Quellen (Art Bible) → gebakene Raster-Atlanten für
  Canvas (Build-Schritt), SVG-Sprite für DOM-Icons; strikte Budgets
  (Erst-Load Region < 1.5 MB komprimiert, Nachladen pro Bezirks-Stufe).
- **Messlatte (CI-geprüfte Ziele):** TTI Management-Screens < 2 s (3G-schnell),
  Region-Erstaufbau < 4 s, Interaktionslatenz Listen < 50 ms bei 1000
  Instanzen (virtualisiert ⇒ konstant), Speicher-Ceiling Szene < 300 MB.

## J.3 Skalierungs-Checkliste für jedes neue Feature

1. Was ist die Aggregations-Ebene? (Pflichtantwort vor UI-Design)
2. Rendert irgendetwas O(n) mit Instanzen/Spielern? → Virtualisieren/Cluster.
3. Gibt es Filter + Suche + gespeicherte Ansicht ab v1?
4. Funktioniert der Screen mit 10× Content (C.1-Frage)?
5. Massenaktion vorhanden, wo Masse entstehen kann?

---

# Teil K — Migrationsplan & Auswirkungen

## K.1 Phasen (grob; Ticket-Schnitt folgt separat, docs/11-Stil)

| Phase | Inhalt | Wert |
|---|---|---|
| **1. Fundament** | Token-Umstellung (G.3), Icon-System statt Emoji, neue Shell (HUD-Bar, Nav-Rail, Bottom-Nav, Ticker-Slot), Komponenten-Grundstock (G.6), Command Center ersetzt Dashboard-Route | Sofort sichtbarer Identitätswechsel, alle künftigen Screens bauen richtig |
| **2. Masse beherrschen** | Industrie-Screen neu (Gruppierung, VirtualTable, Filter/Tags/SavedViews, Mass-Bar), Katalog neu, Inventar, Produktion (Übersicht) — inkl. Aggregat-API-Tickets | Skalierbarkeit gelöst, bevor Content wächst |
| **3. Herzstück** | Region v1: Szene mit Landschafts-Sockel, 6–8 Bezirks-Plots à 3 Stufen, Tag/Nacht, 6 Ambient-Animatoren, Bezirks-Overlay; Onboarding-Flow (E.1) | Immersion — Forgery sieht erstmals nach Spiel aus |
| **4. Wirtschaft & Wissen** | Markt (D.5 voll), Forschung (Tree Desktop / Spalten Mobile), Ketten-Detail, Collect-/Reward-Momente | Langzeitmotivation |
| **5. MMO-Schicht** | Weltkarte v1 (soziale Marker), Rangliste neu, Nachrichten, Quests/Events-Screen; danach Firmen → Allianz → Logistik entlang Backend-Roadmap 2.0–4.0 | Aus Single-Player-Gefühl wird Welt |

Jede Phase liefert shippbaren Zustand; Platzhalter-Seiten werden durch
Teaser-Zustände (C.1) ersetzt, nie durch neue leere Seiten.

## K.2 Doku-Folgeänderungen

- `docs/06-frontend.md`: §3 (UI/UX) ersetzen durch Verweis auf dieses Dokument;
  §4 Token-Tabelle auf G.3 umstellen; §7 um J.1/J.2 erweitern. §1/§2/§5/§6
  bleiben.
- `backend/docs/10-art-bible.md`: §1 Leitidee/Ausschlüsse gemäß B.3/G.1
  revidieren; §2 Palette auf „Warm Industrial" umstellen; neue Asset-Klassen
  (Bezirks-Kompositionen, Landschafts-Tiles, Ambient-Sprites, Weltkarten-Tiles)
  inkl. Prompt-Vorlagen ergänzen.
- `backend/docs/00-canon.md` / `05-api-spec.md`: Aggregat-Endpoints (J.1),
  Batch-Aktionen + Bauqueue-Slots (D.3.2), Bezirks-Ableitung (D.2.1,
  deterministische Zuordnung Kategorie → Plot → Stufe) als Kanon-Erweiterungen
  einbringen.
- Namensentscheidung **Forgery vs. Foundry** treffen und überall
  vereinheitlichen (Shell zeigt aktuell „Foundry", Repos heißen „forgery").

## K.3 Offene Produktentscheidungen (vor Phase 3 klären)

1. Rendering-Engine-Spike: PixiJS vs. leichtgewichtige Eigenlösung (Canvas2D
   reicht evtl. für v1-Szene) — Kriterien: Bundle, Mobile-GPU, Team-Skill.
2. Regions-Seed: rein kosmetische Varianz oder spielmechanische Unterschiede
   (Kanon-Frage mit Balancing-Folgen).
3. Bauqueue-Erweiterung (Slots > 1) — Voraussetzung für glaubwürdiges
   Mass-Upgrade; Balancing-Impact klären.
4. Sound-Design ja/nein/wann (Slots sind im Feedback-Konzept vorgesehen,
   I.1/B.2-P6; Asset-Frage offen).

---

*Ende v1.0 — Änderungen an diesem Dokument folgen dem Kanon-Prinzip: erst hier,
dann in den abhängigen Dokumenten und Tickets.*
