/**
 * API-DTOs für Foundry. Konsistent mit docs/00-canon.md — alle Codes
 * (Ressourcen, Gebäude, Techs, Rezepte) sind die stabilen String-IDs aus dem Kanon.
 * Zeiten sind ISO-8601-Strings (Serverzeit, siehe Client-Zeit-Regel in docs/06-frontend.md §6).
 */

// ── Ressourcen (Kanon §3, 15 Stück) ─────────────────────────────────────────

export type ResourceCode =
  | 'wood'
  | 'stone'
  | 'iron'
  | 'copper'
  | 'coal'
  | 'water'
  | 'energy'
  | 'planks'
  | 'bricks'
  | 'steel'
  | 'cable'
  | 'tools'
  | 'machines'
  | 'electronics'
  | 'research_points';

export type ResourceTier = 'RAW' | 'SPECIAL' | 'T2' | 'T3' | 'T4';

export interface ResourceStock {
  resource: ResourceCode;
  /** Gesamtbestand (inkl. reserviert). */
  amount: number;
  /** Durch Markt-Listings reserviert (Kanon §7.7). */
  reserved: number;
  /** Lagerlimit pro Ressource (Kanon §7.5); Energie: 0 (nicht lagerbar). */
  capacity: number;
  /** Nettorate/h aus der letzten Lazy-Berechnung (negativ = Nettoverbrauch). */
  ratePerHour: number;
}

/** Energie ist eine Bilanz, kein Bestand (Kanon §1). */
export interface EnergyBalance {
  productionPerHour: number;
  demandPerHour: number;
  /** min(1, production/demand); < 1 → Verbraucher gedrosselt. */
  throttleFactor: number;
}

// ── Spieler ──────────────────────────────────────────────────────────────────

export type PlayerRole = 'PLAYER' | 'ADMIN';

export interface PlayerProfile {
  id: string; // UUID v7
  username: string;
  level: number;
  xp: number;
  /** Kumulative XP-Schwelle für das nächste Level (Kanon §7.6). */
  xpForNextLevel: number;
  coins: number;
  researchPoints: number;
  buildingSlotsUsed: number;
  buildingSlotsTotal: number; // 8 + Level − 1, max 30 (Kanon §2)
  roles: PlayerRole[];
  createdAt: string;
}

// ── Gebäude (Kanon §4) ───────────────────────────────────────────────────────

export type BuildingCode =
  | 'lumberjack'
  | 'quarry'
  | 'water_pump'
  | 'iron_mine'
  | 'copper_mine'
  | 'coal_plant'
  | 'sawmill'
  | 'brickworks'
  | 'steel_mill'
  | 'cable_works'
  | 'tool_factory'
  | 'machine_factory'
  | 'electronics_plant'
  | 'research_lab'
  | 'warehouse';

export type BuildingCategory =
  | 'RAW_MATERIAL'
  | 'ENERGY'
  | 'PROCESSING'
  | 'FACTORY'
  | 'RESEARCH'
  | 'INFRASTRUCTURE';

export interface ResourceAmount {
  resource: ResourceCode;
  amount: number;
}

export interface BuildingCatalogEntry {
  code: BuildingCode;
  name: string;
  description: string;
  category: BuildingCategory;
  iconKey: string; // = code (Kanon §4)
  maxLevel: number; // 10 im MVP
  /** Baukosten Level 1 (Coins als Teil der Liste? Nein: separat). */
  baseCostCoins: number;
  baseCostResources: ResourceAmount[];
  baseTimeSeconds: number;
  baseEnergyPerHour: number;
  /** Tech-Code, der das Gebäude freischaltet; null = ab Start. */
  requiredTech: TechCode | null;
  /** Vom Spieler bereits freigeschaltet? */
  unlocked: boolean;
  /** true für warehouse (global einmalig, Kanon §2). */
  singleton: boolean;
}

export interface PlayerBuilding {
  id: string; // UUID der Instanz
  code: BuildingCode;
  level: number;
  /** Aktives Rezept (genau eines je Instanz, Kanon §5). */
  activeRecipe: RecipeCode | null;
  /** Für diese Instanz wählbare (freigeschaltete) Rezepte. */
  availableRecipes: RecipeCode[];
  /** Effektive Raten auf aktuellem Level inkl. Tech-/Event-Multiplikator. */
  inputsPerHour: ResourceAmount[];
  outputsPerHour: ResourceAmount[];
  energyPerHour: number;
  /** Laufender Bau/Upgrade auf dieser Instanz? */
  underConstruction: boolean;
}

/** Laufende Bau-/Upgrade-Aktion (max. eine pro Spieler, Kanon §7.2). */
export interface ConstructionJob {
  id: string;
  buildingInstanceId: string | null; // null = Neubau
  buildingCode: BuildingCode;
  targetLevel: number;
  startedAt: string;
  completesAt: string;
}

// ── Rezepte (Kanon §5) ───────────────────────────────────────────────────────

export type RecipeCode =
  | 'wood_basic'
  | 'stone_basic'
  | 'coal_seam'
  | 'water_basic'
  | 'iron_basic'
  | 'copper_basic'
  | 'energy_coal'
  | 'energy_overdrive'
  | 'planks_basic'
  | 'planks_hardwood'
  | 'bricks_basic'
  | 'bricks_coalfired'
  | 'steel_basic'
  | 'steel_efficient'
  | 'cable_basic'
  | 'cable_fine'
  | 'tools_basic'
  | 'tools_steel2'
  | 'machines_basic'
  | 'machines_assembly'
  | 'electronics_basic'
  | 'electronics_pcb'
  | 'research_1'
  | 'research_2'
  | 'research_3';

export interface RecipeInfo {
  code: RecipeCode;
  name: string;
  building: BuildingCode;
  /** Basis-Raten pro Stunde auf Gebäudelevel 1 (Kanon §5). */
  inputsPerHour: ResourceAmount[];
  outputsPerHour: ResourceAmount[];
  /** Tech-Code der Freischaltung; null = ab Start. */
  requiredTech: TechCode | null;
  unlocked: boolean;
}

// ── Forschung (Kanon §6) ─────────────────────────────────────────────────────

export type TechCode =
  | 'tech_woodworking'
  | 'tech_claybaking'
  | 'tech_mining1'
  | 'tech_mining2'
  | 'tech_coal'
  | 'tech_energy'
  | 'tech_steel'
  | 'tech_copperworks'
  | 'tech_toolmaking'
  | 'tech_machinery'
  | 'tech_electronics'
  | 'tech_applied_research'
  | 'tech_logistics1'
  | 'tech_logistics2'
  | 'tech_saws'
  | 'tech_blastfurnace'
  | 'tech_automation1'
  | 'tech_market_license'
  | 'tech_trading'
  | 'tech_energy_eff';

export type TechStatus = 'RESEARCHED' | 'AVAILABLE' | 'LOCKED' | 'IN_PROGRESS';

export interface TechNode {
  code: TechCode;
  name: string;
  description: string;
  costFp: number;
  durationSeconds: number;
  prerequisites: TechCode[];
  /** Effektbeschreibung für die UI (Gebäude/Rezepte/Boni). */
  effectSummary: string;
  status: TechStatus;
  /** Tier = Abhängigkeitstiefe, für die Listen-Gruppierung (docs/06 §3.5). */
  tier: number;
}

/** Aktiver Forschungsjob (genau einer pro Spieler, Kanon §6). */
export interface ResearchJob {
  tech: TechCode;
  name: string;
  startedAt: string;
  completesAt: string;
}

// ── Markt (Kanon §7.7) ───────────────────────────────────────────────────────

export interface MarketListing {
  id: string;
  resource: ResourceCode;
  /** Verbleibende Menge (Teilkäufe erlaubt). */
  amount: number;
  pricePerUnit: number;
  sellerName: string;
  /** true, wenn Listing dem eingeloggten Spieler gehört. */
  own: boolean;
  createdAt: string;
  /** null = kein Ablauf. */
  expiresAt: string | null;
  /** NPC-Referenzpreis zur Δ-Anzeige (Kanon §3). */
  referencePrice: number;
}

export interface PriceHistoryPoint {
  /** Bucket-Zeitstempel (ISO-8601). */
  timestamp: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  volume: number;
}

// ── Leaderboard (Kanon §9) ───────────────────────────────────────────────────

export type LeaderboardType = 'NET_WORTH' | 'PRODUCTION_SCORE' | 'MARKET_VOLUME';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  playerLevel: number;
  score: number;
  /** true für die eigene Zeile (sticky Anzeige). */
  self: boolean;
}

// ── Belohnungen (Kanon §7.8 / §8) ────────────────────────────────────────────

export interface DailyRewardStatus {
  /** Aktueller Streak-Tag 1–7 (resettet bei Lücke). */
  streakDay: number;
  claimableToday: boolean;
  /** Serverzeitpunkt, ab dem der nächste Claim möglich ist. */
  nextClaimAt: string | null;
  /** Vorschau der 7 Streak-Rewards für die Leiste. */
  rewards: DailyReward[];
}

export interface DailyReward {
  day: number; // 1–7
  coins: number;
  resources: ResourceAmount[];
}

export interface Achievement {
  code: string; // z. B. 'ach_first_building' (Kanon §8)
  name: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  unlocked: boolean;
  unlockedAt: string | null;
  /** Fortschritt 0..1 für die Progress-Anzeige (falls messbar). */
  progress: number;
}

// ── Gemeinsame Response-Hülle für Zeit-Sync ──────────────────────────────────

/** Antworten mit zeitkritischen Daten tragen die Serverzeit für den Offset. */
export interface TimedResponse<T> {
  serverTime: string;
  data: T;
}
