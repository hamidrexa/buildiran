/**
 * BuildIran — App-wide Constants
 */

// ─── App Info ────────────────────────────────────────────────────────────────

export const APP_NAME = "بیلد ایران";
export const APP_NAME_EN = "BuildIran";
export const APP_SCHEME = "buildiran";
export const APP_VERSION = "1.0.0";

// ─── Map Config ──────────────────────────────────────────────────────────────

/** Default center: Tehran, Iran */
export const MAP_DEFAULT_CENTER = {
  latitude: 35.6892,
  longitude: 51.389,
} as const;

export const MAP_DEFAULT_ZOOM = 10;
export const MAP_MIN_ZOOM = 4;
export const MAP_MAX_ZOOM = 19;

/**
 * OpenFreeMap vector tile style — completely free, no API key required.
 * Alternatives: 'https://demotiles.maplibre.org/style.json'
 */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

/** Dark game map style — use for game mode */
export const MAP_DARK_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

// ─── Game Config ─────────────────────────────────────────────────────────────

/** Side length of each game tile in meters */
export const TILE_SIZE_METERS = 500;

/** Max buildings per tile */
export const MAX_BUILDINGS_PER_TILE = 5;

/** Real-time sync interval in milliseconds */
export const SYNC_INTERVAL_MS = 5000;

// ─── Supabase ─────────────────────────────────────────────────────────────────

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ─── Realtime Channels ────────────────────────────────────────────────────────

export const CHANNEL_WORLD = "world:events";
export const CHANNEL_TILES = "world:tiles";

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const STORAGE_PLAYER_ID = "buildiran:player_id";
export const STORAGE_PLAYER_DATA = "buildiran:player_data";

// ─── Animation ────────────────────────────────────────────────────────────────

export const ANIMATION_MAP_FLY_DURATION = 800;

// ─── Iran Bounds ──────────────────────────────────────────────────────────────

export const IRAN_BOUNDS = {
  northEast: { latitude: 39.78, longitude: 63.32 },
  southWest: { latitude: 25.06, longitude: 44.03 },
} as const;
