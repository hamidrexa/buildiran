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

export type BuildingType =
  | 'house'
  | 'farm'
  | 'market'
  | 'tower'
  | 'warehouse'
  | 'barracks';

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
  level: number;
  experience: number;
  resources: ResourceMap;
  ownedTileIds: string[];
  buildingIds: string[];
  score: number;
  rank: number;
  status: PlayerStatus;
  joinedAt: string;
  lastSeenAt: string;
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
