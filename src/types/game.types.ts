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
  | 'office';

export type BuildingType = StandardBuildingType | (string & {});

export type BuildingCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'military'
  | 'cultural'
  | 'tech';

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
  type: BuildingType;
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
  | 'resource_collected';

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
