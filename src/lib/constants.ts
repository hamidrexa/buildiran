/**
 * BuildIran — App-wide Constants
 */

// ─── App Info ────────────────────────────────────────────────────────────────

export const APP_NAME = "بیلد ایران";
export const APP_NAME_EN = "BuildIran";
export const APP_SCHEME = "buildiran";
export const APP_VERSION = "1.0.0";

// ─── Map Config ──────────────────────────────────────────────────────────────

/** Default center: Tehran, Iran (Valiasr / Enghelab) */
export const MAP_DEFAULT_CENTER = {
  latitude: 35.6892,
  longitude: 51.389,
} as const;

/** Street-level zoom so streets, alleys, and building plots are immediately visible */
export const MAP_DEFAULT_ZOOM = 15;
export const MAP_MIN_ZOOM = 4;
export const MAP_MAX_ZOOM = 19;

/**
 * High-detail street map style (CartoDB Voyager / OpenStreetMap raster tiles).
 * Renders high-contrast streets, alleys, avenues, and clear Persian/English labels.
 */
export const MAP_STREET_STYLE = {
  version: 8,
  name: "BuildIran Streets",
  sources: {
    "carto-voyager": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, © CARTO",
    },
  },
  layers: [
    {
      id: "carto-voyager-layer",
      type: "raster",
      source: "carto-voyager",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
} as const;

/** Standard OpenStreetMap raster style */
export const MAP_OSM_STYLE = {
  version: 8,
  name: "OpenStreetMap",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-layer",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
} as const;

/** High-contrast dark street map style for night/game mode */
export const MAP_DARK_STYLE = {
  version: 8,
  name: "BuildIran Dark Streets",
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, © CARTO",
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
} as const;

/** Default active map style */
export const MAP_STYLE = MAP_STREET_STYLE;

/** Backward-compatibility aliases */
export const MAP_STYLE_URL = MAP_STREET_STYLE;
export const MAP_DARK_STYLE_URL = MAP_DARK_STYLE;
export const MAP_OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";


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
