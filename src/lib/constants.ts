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
export const MAP_MAX_ZOOM = 18;

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
export const MAP_STYLE = MAP_OSM_STYLE;

/** Backward-compatibility aliases */
export const MAP_STYLE_URL = MAP_OSM_STYLE;
export const MAP_DARK_STYLE_URL = MAP_DARK_STYLE;
export const MAP_OPENFREEMAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

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

// ─── Economy: Power Tiers ─────────────────────────────────────────────────────
// 6-tier progression. XP grows ~5x per tier to sustain long-term engagement.
// Power within a tier accumulates via asset ownership, services, and daily drip.
// XP is the unlock gate to advance to the next tier.

export const POWER_TIERS = [
  { tier: 1, nameFa: 'تازه‌کار', minPower: 0, maxPower: 20, xpRequired: 100 },
  { tier: 2, nameFa: 'شهروند', minPower: 21, maxPower: 50, xpRequired: 500 },
  { tier: 3, nameFa: 'استاندار', minPower: 51, maxPower: 150, xpRequired: 2000 },
  { tier: 4, nameFa: 'فرماندار', minPower: 151, maxPower: 500, xpRequired: 10000 },
  { tier: 5, nameFa: 'سلطان', minPower: 501, maxPower: 2000, xpRequired: 50000 },
  { tier: 6, nameFa: 'شاهنشاه', minPower: 2001, maxPower: Infinity, xpRequired: Infinity },
] as const;

export type PowerTierIndex = 1 | 2 | 3 | 4 | 5 | 6;

/** Resolve tier object from a raw power value */
export function getPlayerTier(power: number) {
  for (let i = POWER_TIERS.length - 1; i >= 0; i--) {
    if (power >= POWER_TIERS[i].minPower) return POWER_TIERS[i];
  }
  return POWER_TIERS[0];
}

// ─── Economy: Institution Definitions ────────────────────────────────────────
// Every institution is a conversion formula:
//   client pays (cash or activity) → client gains (power or cash)
//   provider pays (activity)       → provider gains (% share of client cash)
//
// providerCost / providerGain are undefined for system-run institutions
// (home_rent, exchange) that have no player provider.

export type InstitutionStatSource = 'cash' | 'activity';
export type InstitutionStatTarget = 'power' | 'cash';

export interface InstitutionDefinition {
  nameFa: string;
  emoji: string;
  clientCost: { stat: InstitutionStatSource; amount: number };
  clientGain: { stat: InstitutionStatTarget; amount: number };
  providerCost?: { stat: 'activity'; amount: number };
  /** Percent (0–100) of client cash cost that goes to the provider */
  providerGainPercent?: number;
  /** Building types that count as this institution */
  buildingTypes: string[];
}

export const INSTITUTION_DEFINITIONS: Record<string, InstitutionDefinition> = {
  home_rent: {
    nameFa: 'اجاره مسکن',
    emoji: '🏠',
    clientCost: { stat: 'cash', amount: 200 },
    clientGain: { stat: 'power', amount: 5 },
    buildingTypes: ['house', 'villa'],
  },
  shopping: {
    nameFa: 'خرید و پوشاک',
    emoji: '🛍️',
    clientCost: { stat: 'cash', amount: 300 },
    clientGain: { stat: 'power', amount: 6 },
    providerCost: { stat: 'activity', amount: 10 },
    providerGainPercent: 60,
    buildingTypes: ['shop', 'mall', 'market'],
  },
  hospital: {
    nameFa: 'خدمات درمانی',
    emoji: '🏥',
    clientCost: { stat: 'cash', amount: 500 },
    clientGain: { stat: 'power', amount: 15 },
    providerCost: { stat: 'activity', amount: 20 },
    providerGainPercent: 55,
    buildingTypes: ['hospital'],
  },
  university: {
    nameFa: 'آموزش دانشگاهی',
    emoji: '🎓',
    clientCost: { stat: 'cash', amount: 400 },
    clientGain: { stat: 'power', amount: 12 },
    providerCost: { stat: 'activity', amount: 15 },
    providerGainPercent: 50,
    buildingTypes: ['university'],
  },
  cafe: {
    nameFa: 'کافه و رستوران',
    emoji: '☕',
    clientCost: { stat: 'cash', amount: 150 },
    clientGain: { stat: 'power', amount: 3 },
    providerCost: { stat: 'activity', amount: 8 },
    providerGainPercent: 65,
    buildingTypes: ['cafe'],
  },
  gym: {
    nameFa: 'باشگاه ورزشی',
    emoji: '🏋️',
    clientCost: { stat: 'cash', amount: 250 },
    clientGain: { stat: 'power', amount: 8 },
    providerCost: { stat: 'activity', amount: 12 },
    providerGainPercent: 58,
    buildingTypes: ['gym'],
  },
  library: {
    nameFa: 'کتابخانه و فرهنگسرا',
    emoji: '📚',
    clientCost: { stat: 'cash', amount: 100 },
    clientGain: { stat: 'power', amount: 4 },
    providerCost: { stat: 'activity', amount: 6 },
    providerGainPercent: 45,
    buildingTypes: ['library'],
  },
  /** Exchange: converts the client's Activity into Cash.
   *  Rate is determined by EXCHANGE_RATES — not a fixed amount here.
   *  clientCost.amount = 1 unit of activity (rate multiplied at runtime). */
  exchange: {
    nameFa: 'بورس فعالیت',
    emoji: '🏦',
    clientCost: { stat: 'activity', amount: 1 },
    clientGain: { stat: 'cash', amount: 2 }, // base rate; overridden by EXCHANGE_RATES
    buildingTypes: ['office', 'tower'],
  },
} as const;

// ─── Economy: Exchange Rates ──────────────────────────────────────────────────
// Exchange institution converts Activity → Cash.
// Rate depends on the client's business ownership status.
//   base             — no business (lazy tax)
//   ownerBonus       — owns a business in the same category as the exchange
//   establishedBiz   — owns a level-2+ business used within the last 7 days

export const EXCHANGE_RATES = {
  /** 1 activity = 2 cash — no business owned */
  base: 2,
  /** 1 activity = 3.5 cash — owns a business (same category bonus) */
  ownerBonus: 3.5,
  /** 1 activity = 5 cash — established business (level ≥ 2, used within 7 days) */
  establishedBusiness: 5,
} as const;

/** A business is "established" if level >= this AND used within ESTABLISHED_BIZ_DAYS days */
export const ESTABLISHED_BIZ_MIN_LEVEL = 2;
export const ESTABLISHED_BIZ_DAYS = 7;

// ─── Economy: Daily Power Drip (pg_cron) ─────────────────────────────────────
// Power added to a player's total once per day (midnight UTC via pg_cron)
// for every asset they own of that type.

export const DAILY_POWER_DRIP: Record<string, number> = {
  house: 1,
  villa: 2,
  shop: 2,
  market: 2,
  mall: 3,
  office: 2,
  farm: 1,
  warehouse: 1,
  tower: 5,
  barracks: 8,
  // custom building types inherit the value from their custom_settings.daily_power_drip
} as const;

// ─── Economy: Popularity Boost ────────────────────────────────────────────────
// Owners of player-run businesses can spend popularity for 2× income.

/** Base popularity cost — multiplied by asset.level at activation time */
export const POPULARITY_BOOST_BASE_COST = 10;

/** Duration of the boost in hours (flat 24h window, non-stackable) */
export const POPULARITY_BOOST_DURATION_HOURS = 24;

/** Income multiplier while boost is active */
export const POPULARITY_BOOST_MULTIPLIER = 2;

// ─── Economy: Popularity from Viewport Views ─────────────────────────────────

/** Popularity points granted to an asset owner per unique daily viewport view */
export const POPULARITY_PER_VIEW = 1;

/** How many ms between passive viewport view batches being sent to Supabase */
export const VIEWPORT_VIEW_FLUSH_INTERVAL_MS = 5000;

// ─── Economy: Activity Events ─────────────────────────────────────────────────
// Every trackable user action awards activity points.
// These are accumulated in profiles.activity and reset daily by pg_cron.

export const ACTIVITY_EVENTS = {
  tile_load: 1,   // a new map tile enters the viewport
  marketplace_view: 2,   // player opens the marketplace tab
  asset_inspect: 2,   // player opens an asset detail (own or other's)
  trade_complete: 10,  // player buys an asset from the marketplace
  build_complete: 8,   // player builds a new asset
  upgrade_complete: 6,   // player upgrades an existing asset
  service_used: 5,   // player uses a service institution as a client
  exchange_used: 4,   // player uses the exchange institution
  proposal_submitted: 5,   // player submits a custom building proposal
} as const;

export type ActivityEventKey = keyof typeof ACTIVITY_EVENTS;

