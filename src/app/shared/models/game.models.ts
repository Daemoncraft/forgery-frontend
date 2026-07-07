/**
 * API-DTOs für Foundry — 1:1 die JSON-Verträge des Backends
 * (forgery-backend, docs/05-api-spec.md). Codes sind die stabilen String-IDs
 * aus dem Kanon; Zeiten sind ISO-8601-Strings (Serverzeit ist autoritativ,
 * der Client rechnet nie selbst Bestände hoch).
 */

// ── Auth (POST /api/auth/login | /refresh, GET /api/auth/me) ─────────────────

export interface TokenResponse {
  playerId: string;
  username: string;
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
}

export type PlayerRole = 'PLAYER' | 'MODERATOR' | 'GAME_MASTER' | 'ADMIN';

export interface PlayerProfile {
  playerId: string;
  username: string;
  displayName: string | null;
  roles: PlayerRole[];
  coins: number;
  level: number;
  xp: number;
  buildingSlots: number;
}

// ── Inventory (GET /api/inventory, GET /api/inventory/resources) ─────────────

export interface InventoryResponse {
  resources: ResourceStock[];
}

export interface ResourceStock {
  code: string;
  amount: number;
  /** Durch Markt-Listings reserviert (im MVP immer 0). */
  reserved: number;
  available: number;
  /** Lagerlimit pro Ressource (Kanon §7.5). */
  capacity: number;
}

export interface ResourceCatalogResponse {
  resources: ResourceDefinition[];
}

export interface ResourceDefinition {
  code: string;
  name: string;
  tier: 'RAW' | 'SPECIAL' | 'T2' | 'T3' | 'T4';
  storable: boolean;
  tradable: boolean;
  referencePrice?: number;
  iconKey: string;
}

// ── Production (GET /api/production/summary, POST /api/production/collect) ───

export interface EnergyBalance {
  productionPerHour: number;
  demandPerHour: number;
  /** min(1, Erzeugung/Bedarf); < 1 → Energie-Verbraucher gedrosselt. */
  throttle: number;
}

export interface ResourceRate {
  code: string;
  producedPerHour: number;
  consumedPerHour: number;
  netPerHour: number;
}

export interface ProductionSummaryResponse {
  netRatesPerHour: ResourceRate[];
  energy: EnergyBalance;
  lastCalculatedAt: string;
}

export interface ResourceAmount {
  code: string;
  amount: number;
}

export interface CollectResponse {
  period: { from: string; to: string };
  produced: ResourceAmount[];
  consumed: ResourceAmount[];
  overflowLost: ResourceAmount[];
  energy: EnergyBalance;
  lastCalculatedAt: string;
}

// ── Buildings (GET /api/buildings/catalog | /me, POST build/upgrade) ─────────

export interface BuildingCost {
  coins: number;
  resources: ResourceAmount[];
}

export interface BuildingCatalogEntry {
  code: string;
  name: string;
  category: 'RAW' | 'ENERGY' | 'PROCESSING' | 'FACTORY' | 'RESEARCH' | 'INFRASTRUCTURE';
  description: string;
  iconKey: string;
  maxLevel: number;
  singleton: boolean;
  /** Freischaltende Technologie noch nicht erforscht. */
  locked: boolean;
  requiredTechnologyCode: string | null;
  baseCost: BuildingCost;
  baseTimeSeconds: number;
  energyPerHour: number;
  recipeCodes: string[];
}

export interface BuildingCatalogResponse {
  buildings: BuildingCatalogEntry[];
}

export type BuildingStatus = 'ACTIVE' | 'UNDER_CONSTRUCTION' | 'UPGRADING';

export interface ConstructionInfo {
  targetLevel: number;
  finishesAt: string;
}

export interface NextUpgrade {
  targetLevel: number;
  cost: BuildingCost;
  timeSeconds: number;
}

export interface PlayerBuilding {
  id: string;
  buildingCode: string;
  level: number;
  status: BuildingStatus;
  activeRecipeCode: string | null;
  occupiesSlot: boolean;
  construction: ConstructionInfo | null;
  nextUpgrade: NextUpgrade | null;
}

export interface MyBuildingsResponse {
  buildingSlots: { used: number; total: number };
  constructionActive: boolean;
  buildings: PlayerBuilding[];
}

export interface BuildingActionResponse {
  id: string;
  buildingCode: string;
  level: number;
  status: BuildingStatus;
  construction: ConstructionInfo | null;
  charged: BuildingCost;
}
