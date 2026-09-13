/**
 * BuildIran — TypeScript Game Types
 */

// ─── Coordinates ───────────────────────────────────────────────────────────

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Bounds {
  northEast: LatLng;
  southWest: LatLng;
}

// ─── Tile / Land ────────────────────────────────────────────────────────────

export type TileStatus = 'available' | 'owned' | 'enemy' | 'neutral';

export interface GameTile {
  id: string;
  /** Center coordinate of the tile */
  center: LatLng;
  /** Polygon boundary of the tile */
  bounds: LatLng[];
  status: TileStatus;
  ownerId: string | null;
  buildingIds: string[];
  /** ISO timestamp of last update */
  updatedAt: string;
}

// ─── Buildings ──────────────────────────────────────────────────────────────

export type StandardBuildingType =
  | 'house'
  | 'farm'
  | 'market'
  | 'tower'
  | 'warehouse'
  | 'barracks'
  | 'shop'
  | 'mall'
  | 'villa'
  | 'office'
  // v3 — new types
  | 'restaurant'
  | 'gym'
  | 'cafe'
  | 'factory'
  | 'hospital'
  | 'park'
  | 'university'
  | 'bank'
  // v4 — NPC housing types
  | 'main_house'
  | 'resident_house';

export type BuildingType = StandardBuildingType | (string & {});

export type BuildingCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'military'
  | 'cultural'
  | 'tech';

/** 4-type institution classification (v3) */
export type InstitutionCategory = 'residential' | 'commercial' | 'industrial' | 'public';

/** Build mode: pay premium for instant build vs. manually gather materials */
export type BuildMode = 'fast' | 'advanced';

/** Source of a build material item in Advanced mode */
export type MaterialSource = 'market' | 'subsidized';

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface CustomBuildingType {
  id: string;
  code: string;
  nameFa: string;
  descriptionFa: string;
  neighborhoodId?: string | null;
  category: BuildingCategory;
  baseCost: number;
  powerBonus: number;
  incomeRate: number;
  iconName: string;
  emoji: string;
  colorPrimary: string;
  colorSecondary: string;
  customSettings: Record<string, any>;
  proposedBy: string;
  status: ProposalStatus;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface Neighborhood {
  id: string;
  city: string;
  nameFa: string;
  descriptionFa?: string | null;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  minEditorPower: number;
  createdAt: string;
  areaNumber?: number;
  areaName?: string;
  isLocked?: boolean;
}

export interface NeighborhoodEditor {
  id: string;
  neighborhoodId: string;
  playerId: string;
  assignedAt: string;
  isLeadEditor: boolean;
}

export interface Building {
  id: string;
  type: BuildingType;
  level: number;
  tileId: string;
  ownerId: string;
  /** Resources produced per hour */
  production: Partial<ResourceMap>;
  /** Resources required to build */
  buildCost: Partial<ResourceMap>;
  builtAt: string;
  upgradedAt: string | null;
}

// ─── Resources ──────────────────────────────────────────────────────────────

export interface ResourceMap {
  gold: number;
  wood: number;
  stone: number;
  food: number;
  population: number;
}

// ─── Economy: Power Tier ─────────────────────────────────────────────────────

export interface PowerTier {
  tier: number;
  nameFa: string;
  minPower: number;
  maxPower: number;
  xpRequired: number;
}

// ─── Economy: Institution ────────────────────────────────────────────────────

/** All supported institution type codes */
export type InstitutionType =
  | 'home_rent'
  | 'shopping'
  | 'hospital'
  | 'university'
  | 'cafe'
  | 'gym'
  | 'library'
  | 'exchange'
  // v3 — new types
  | 'restaurant'
  | 'park_service'
  | 'bank_service'
  | 'farm_supply'
  | 'factory_supply'
  | 'industrial_supply';

/** Result of using an institution as a client */
export interface ServiceResult {
  success: boolean;
  clientCostStat: 'cash' | 'activity';
  clientCostAmount: number;
  clientGainStat: 'power' | 'cash';
  clientGainAmount: number;
  providerCashEarned?: number;
  providerPowerEarned?: number;
  providerPopularityEarned?: number;
  errorCode?: string;
}

/** DB row for service_transactions table */
export interface ServiceTransaction {
  id: string;
  businessAssetId: string;
  providerId: string;
  clientId: string;
  institutionType: InstitutionType;
  clientCostStat: string;
  clientCostAmount: number;
  clientGainStat: string;
  clientGainAmount: number;
  providerActivitySpent: number;
  providerCashEarned: number;
  providerPowerEarned: number;
  providerPopularityEarned: number;
  createdAt: string;
}

// ─── Economy: Asset Views ────────────────────────────────────────────────────

/** Passive viewport view — recorded when another player's asset enters viewport */
export interface AssetView {
  id: string;
  assetId: string;
  viewerId: string;
  ownerId: string;
  viewedAt: string;
}

/** Aggregated engagement data for an asset owner's dashboard */
export interface EngagementData {
  assetId: string;
  viewsToday: number;
  viewsThisWeek: number;
  viewsAllTime: number;
  popularityEarned: number;
  topViewers: Array<{ playerId: string; username: string; viewCount: number }>;
  /** Suggestion to upgrade to attract more views */
  upgradeSuggestion?: string;
}

// ─── Economy: Popularity Boost ───────────────────────────────────────────────

export interface PopularityBoost {
  id: string;
  assetId: string;
  ownerId: string;
  popularitySpent: number;
  assetLevel: number;
  activatedAt: string;
  expiresAt: string;
  /** True if current time is before expiresAt */
  isActive: boolean;
}

// ─── Advanced Build Mode ─────────────────────────────────────────────────────

/** A construction material item available from a nearby player-run shop */
export interface NearbyShopItem {
  shopAssetId: string;
  shopOwnerUsername: string;
  itemId: string;
  nameFa: string;
  /** Cash per unit (set freely by shop owner) */
  price: number;
  stock: number;
}

/** A single material slot that must be gathered before confirming an Advanced build */
export interface BuildMaterialSlot {
  slotId: string;
  itemId: string;
  nameFa: string;
  /** Quantity of this material required */
  qtyRequired: number;
  /** How the player sourced this slot (null if not yet gathered) */
  gathered: BuildMaterialGather | null;
}

/** The fill details for a gathered material slot */
export interface BuildMaterialGather {
  source: MaterialSource;
  /** Present only when source === 'market' */
  shopAssetId?: string;
  shopOwnerUsername?: string;
  unitCost: number;
  qty: number;
  /** 1.0 for market, 0.7 for subsidized */
  powerRatio: number;
  /** Subsidy quota consumed (0 for market) */
  quotaCost: number;
}

/** Full in-progress Advanced Build session (client-side mirror of DB row) */
export interface AdvancedBuildSession {
  sessionId: string;
  buildingType: string;
  latitude: number;
  longitude: number;
  tileId: string;
  slots: BuildMaterialSlot[];
  /** Running total cash cost of gathered market items */
  totalCashCost: number;
  /** Running total subsidy quota consumed */
  totalQuotaUsed: number;
  /** Weighted average power ratio across all gathered slots */
  effectivePowerRatio: number;
  /** True when every slot has been gathered */
  allGathered: boolean;
}

// ─── Player ─────────────────────────────────────────────────────────────────

export type PlayerStatus = 'online' | 'offline' | 'in_game';

export interface Player {
  id: string;
  username: string;
  avatarUrl: string | null;
  avatarColor: string;
  level: number;
  experience: number;
  resources: ResourceMap;
  // Economy
  cash: number;           // liquid spendable currency
  // 4-Factor Stats
  power: number;          // military/influence strength
  wealth: number;         // total asset market value
  activity: number;       // daily activity score
  popularity: number;     // social/trade score
  // Power Tier (computed from power value, cached in DB)
  powerTier: number;      // 1–6
  powerXp: number;        // XP within current tier
  // Subsidy quota (resets weekly to 5000)
  subsidyQuota: number;
  subsidyResetAt: string;
  // Ownership
  ownedTileIds: string[];
  buildingIds: string[];
  score: number;
  rank: number;
  status: PlayerStatus;
  joinedAt: string;
  lastSeenAt: string;
}

// ─── Asset (Building on Map) ─────────────────────────────────────────────────

export interface Asset {
  id: string;
  ownerId: string;
  type: BuildingType | string;
  latitude: number;
  longitude: number;
  tileId: string;
  level: number;
  marketValue: number;
  powerBonus: number;
  isForSale: boolean;
  askPrice: number | null;
  builtAt: string;
  upgradedAt: string | null;
  // Economy additions
  incomeRate: number;           // hourly cash income from this asset
  totalViews: number;           // cached lifetime view count
  dailyPowerDrip: number;       // power added to owner daily (via pg_cron)
  institutionType: InstitutionType | null;  // null = not a service institution
  // v3 — Build modes & institution category
  buildMode: BuildMode;
  institutionCategory: InstitutionCategory | null;
  licensePurchased: boolean;
  warehouseFilled: boolean;
  // v4 — NPC housing fields
  maxCapacity: number;          // for resident_house: max NPC residents
  floorCount: number;           // number of floors
  areaM2: number;               // plot area (50/100/200 m²)
  currentWorkerCount: number;   // cached active worker count for businesses
  // Joined owner data
  ownerUsername?: string;
  ownerAvatarColor?: string;
}

// ─── Asset Marketplace Listing ───────────────────────────────────────────────

export type ListingStatus = 'active' | 'sold' | 'cancelled';

export interface AssetListing {
  id: string;
  assetId: string;
  sellerId: string;
  buyerId: string | null;
  price: number;
  status: ListingStatus;
  listedAt: string;
  soldAt: string | null;
  // joined data
  asset?: Asset;
  sellerUsername?: string;
}

// ─── Game Events ─────────────────────────────────────────────────────────────

export type GameEventType =
  | 'tile_claimed'
  | 'tile_attacked'
  | 'building_built'
  | 'building_upgraded'
  | 'building_demolished'
  | 'player_joined'
  | 'player_left'
  | 'resource_collected'
  // Economy events
  | 'asset_sold'
  | 'service_used'
  | 'exchange_used'
  | 'popularity_boost_activated'
  | 'daily_power_drip'
  | 'power_tier_advanced'
  // v3
  | 'license_purchased'
  | 'warehouse_filled'
  // v4 — NPC events
  | 'npc_hired'
  | 'npc_assigned'
  | 'npc_trained'
  | 'npc_leveled_up';

export interface GameEvent {
  id: string;
  type: GameEventType;
  playerId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

// ─── World State ─────────────────────────────────────────────────────────────

export interface WorldState {
  tiles: Record<string, GameTile>;
  buildings: Record<string, Building>;
  players: Record<string, Player>;
  recentEvents: GameEvent[];
}

// ─── NPC System (v4) ─────────────────────────────────────────────────────────

export type NpcClass =
  | 'worker'
  | 'foreman'
  | 'engineer'
  | 'doctor'
  | 'specialist'
  | 'physician';

export type NpcAssignmentStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface Npc {
  id: string;
  ownerId: string;
  nameFa: string;
  class: NpcClass;
  level: number;                         // 1–10
  experience: number;
  specialties: string[];
  currentBusinessAssetId: string | null; // null = idle
  homeAssetId: string | null;
  isWorking: boolean;
  hiredAt: string;
  lastWorkedAt: string | null;
}

export interface NpcAssignment {
  id: string;
  npcId: string;
  businessAssetId: string;
  requesterId: string;
  businessOwnerId: string;
  status: NpcAssignmentStatus;
  requestedAt: string;
  respondedAt: string | null;
  // Joined data
  npc?: Npc;
  requesterUsername?: string;
  businessAssetType?: string;
}

export interface NpcTrainingSession {
  id: string;
  npcId: string;
  institutionAssetId: string;
  institutionType: string;
  xpGained: number;
  specialtyLearned: string | null;
  cashCost: number;
  startedAt: string;
  completedAt: string;
}
