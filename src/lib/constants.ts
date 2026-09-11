/**
 * BuildIran — App-wide Constants
 */

import type { InstitutionCategory } from '@/types/game.types';

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

// ─── Building Placement Rules ─────────────────────────────────────────────────

/** Default minimum distance (meters) a new building must keep from streets,
 *  squares, parks, water, and bridges. Configurable per-call. */
export const DEFAULT_BUILDING_SETBACK_METERS = 10;

/** Minimum distance (meters) a new building must keep from the player's
 *  own existing assets, so a player can't stack structures on one spot. */
export const DEFAULT_ASSET_SPACING_METERS = 10;

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

// ─── Build Mode Constants ─────────────────────────────────────────────────────

/** Fast mode charges the full base cost (land + construction, bundled) */
export const BUILD_MODE_FAST_COST_MULTIPLIER = 1.0;

/** Advanced (free-market) total cost is ~60% of fast mode */
export const BUILD_MODE_ADVANCED_COST_RATIO = 0.60;

/** Advanced (subsidized) total cost is ~40% of fast mode */
export const BUILD_MODE_SUBSIDIZED_COST_RATIO = 0.40;

/** Power bonus ratio when using subsidized materials (weighted average) */
export const SUBSIDIZED_POWER_RATIO = 0.70;

/** Default weekly subsidy quota per player (resets every Monday 00:00 UTC) */
export const SUBSIDY_QUOTA_DEFAULT = 5000;

/**
 * One-time license fee per building for commercial, industrial, and public buildings.
 * Residential buildings do not require a license.
 */
export const LICENSE_FEE: Record<InstitutionCategory, number> = {
  residential: 0,
  commercial:  500,
  industrial:  800,
  public:      1000,
};

/** Radius in meters to search for nearby player shops in Advanced Build mode */
export const ADVANCED_BUILD_NEARBY_RADIUS_METERS = 500;

// ─── Build Materials Catalog ──────────────────────────────────────────────────
// Used in Advanced Build mode — the player must gather these from nearby shops
// or the state subsidy to complete the build.

export interface BuildMaterialDef {
  itemId: string;
  nameFa: string;
  /** Base state-subsidized price per unit (quota cost = same number in quota units) */
  subsidizedUnitCost: number;
  /** Subsidy quota units consumed per unit bought */
  subsidyQuotaCostPerUnit: number;
}

export const BUILD_MATERIALS: BuildMaterialDef[] = [
  { itemId: 'cement',  nameFa: 'سیمان',  subsidizedUnitCost: 40,  subsidyQuotaCostPerUnit: 40  },
  { itemId: 'steel',   nameFa: 'فولاد',  subsidizedUnitCost: 80,  subsidyQuotaCostPerUnit: 80  },
  { itemId: 'brick',   nameFa: 'آجر',    subsidizedUnitCost: 20,  subsidyQuotaCostPerUnit: 20  },
  { itemId: 'glass',   nameFa: 'شیشه',   subsidizedUnitCost: 50,  subsidyQuotaCostPerUnit: 50  },
  { itemId: 'wood',    nameFa: 'چوب',    subsidizedUnitCost: 30,  subsidyQuotaCostPerUnit: 30  },
  { itemId: 'sand',    nameFa: 'شن',     subsidizedUnitCost: 15,  subsidyQuotaCostPerUnit: 15  },
  { itemId: 'tile',    nameFa: 'کاشی',   subsidizedUnitCost: 35,  subsidyQuotaCostPerUnit: 35  },
  { itemId: 'pipe',    nameFa: 'لوله',   subsidizedUnitCost: 45,  subsidyQuotaCostPerUnit: 45  },
];

/**
 * Required materials per building type for Advanced Build mode.
 * Each entry is an array of { itemId, qtyRequired }.
 */
export const BUILD_MATERIAL_SLOTS: Record<string, Array<{ itemId: string; qtyRequired: number }>> = {
  // ── Residential ──
  house:      [{ itemId: 'cement', qtyRequired: 3 }, { itemId: 'brick', qtyRequired: 5 }, { itemId: 'wood', qtyRequired: 2 }],
  villa:      [{ itemId: 'cement', qtyRequired: 6 }, { itemId: 'brick', qtyRequired: 8 }, { itemId: 'glass', qtyRequired: 3 }, { itemId: 'tile', qtyRequired: 4 }],
  tower:      [{ itemId: 'cement', qtyRequired: 10 }, { itemId: 'steel', qtyRequired: 6 }, { itemId: 'glass', qtyRequired: 8 }, { itemId: 'pipe', qtyRequired: 4 }],
  // ── Commercial ──
  shop:       [{ itemId: 'cement', qtyRequired: 2 }, { itemId: 'brick', qtyRequired: 3 }, { itemId: 'glass', qtyRequired: 2 }],
  cafe:       [{ itemId: 'cement', qtyRequired: 2 }, { itemId: 'tile',  qtyRequired: 4 }, { itemId: 'glass', qtyRequired: 3 }],
  gym:        [{ itemId: 'cement', qtyRequired: 3 }, { itemId: 'steel', qtyRequired: 3 }, { itemId: 'tile',  qtyRequired: 3 }],
  warehouse:  [{ itemId: 'cement', qtyRequired: 2 }, { itemId: 'steel', qtyRequired: 4 }, { itemId: 'sand',  qtyRequired: 4 }],
  exchange:   [{ itemId: 'cement', qtyRequired: 4 }, { itemId: 'glass', qtyRequired: 4 }, { itemId: 'steel', qtyRequired: 2 }],
  mall:       [{ itemId: 'cement', qtyRequired: 8 }, { itemId: 'steel', qtyRequired: 5 }, { itemId: 'glass', qtyRequired: 6 }, { itemId: 'tile', qtyRequired: 5 }],
  restaurant: [{ itemId: 'cement', qtyRequired: 3 }, { itemId: 'tile',  qtyRequired: 5 }, { itemId: 'glass', qtyRequired: 2 }, { itemId: 'pipe', qtyRequired: 2 }],
  // ── Industrial ──
  farm:       [{ itemId: 'wood',   qtyRequired: 4 }, { itemId: 'sand',  qtyRequired: 6 }, { itemId: 'pipe',  qtyRequired: 2 }],
  factory:    [{ itemId: 'cement', qtyRequired: 6 }, { itemId: 'steel', qtyRequired: 8 }, { itemId: 'pipe',  qtyRequired: 5 }],
  // ── Public ──
  hospital:   [{ itemId: 'cement', qtyRequired: 7 }, { itemId: 'steel', qtyRequired: 4 }, { itemId: 'glass', qtyRequired: 5 }, { itemId: 'pipe', qtyRequired: 4 }],
  park:       [{ itemId: 'brick',  qtyRequired: 4 }, { itemId: 'sand',  qtyRequired: 6 }, { itemId: 'wood',  qtyRequired: 5 }],
  university: [{ itemId: 'cement', qtyRequired: 9 }, { itemId: 'steel', qtyRequired: 5 }, { itemId: 'glass', qtyRequired: 6 }, { itemId: 'tile', qtyRequired: 4 }],
  bank:       [{ itemId: 'cement', qtyRequired: 5 }, { itemId: 'steel', qtyRequired: 4 }, { itemId: 'glass', qtyRequired: 4 }],
  // Legacy types
  market:     [{ itemId: 'cement', qtyRequired: 2 }, { itemId: 'brick', qtyRequired: 3 }],
  office:     [{ itemId: 'cement', qtyRequired: 3 }, { itemId: 'glass', qtyRequired: 4 }, { itemId: 'steel', qtyRequired: 2 }],
  barracks:   [{ itemId: 'cement', qtyRequired: 5 }, { itemId: 'steel', qtyRequired: 6 }, { itemId: 'sand',  qtyRequired: 4 }],
};

// ─── Economy: Building Base Costs & Power ─────────────────────────────────────
// Used for Fast Build mode and general building metadata.

export const BUILDING_CONFIG: Record<string, { cost: number; power: number }> = {
  // ── Residential ──
  house:      { cost: 500,  power: 2 },
  villa:      { cost: 3500, power: 5 },
  tower:      { cost: 8000, power: 12 },
  // ── Commercial ──
  shop:       { cost: 1200, power: 3 },
  cafe:       { cost: 1500, power: 4 },
  gym:        { cost: 2000, power: 5 },
  warehouse:  { cost: 1000, power: 2 },
  exchange:   { cost: 4000, power: 8 },
  mall:       { cost: 5000, power: 10 },
  restaurant: { cost: 3000, power: 6 },
  market:     { cost: 1500, power: 3 },
  office:     { cost: 2500, power: 6 },
  // ── Industrial ──
  farm:       { cost: 800,  power: 1 },
  factory:    { cost: 4500, power: 7 },
  // ── Public ──
  hospital:   { cost: 6000, power: 15 },
  park:       { cost: 2000, power: 5 },
  university: { cost: 7000, power: 18 },
  bank:       { cost: 4000, power: 9 },
  // ── Legacy ──
  barracks:   { cost: 4000, power: 20 },
};

// ─── Institution Category Map ─────────────────────────────────────────────────
// Maps every building type to its institution category.

export const INSTITUTION_CATEGORY: Record<string, InstitutionCategory> = {
  // Residential
  house: 'residential', villa: 'residential', tower: 'residential',
  // Commercial
  shop: 'commercial', mall: 'commercial', exchange: 'commercial',
  gym: 'commercial', cafe: 'commercial', restaurant: 'commercial',
  warehouse: 'commercial', market: 'commercial', office: 'commercial',
  // Industrial
  farm: 'industrial', factory: 'industrial',
  // Public
  hospital: 'public', park: 'public', university: 'public', bank: 'public',
  // Legacy / military (no category = no license)
  barracks: 'residential',
};

// ─── Economy: Institution Definitions ────────────────────────────────────────
// Every institution is a conversion formula:
//   client pays (cash or activity) → client gains (power or cash)
//   provider pays (activity)       → provider gains (% share of client cash + optional power/popularity)
//
// providerCost / providerGain are undefined for system-run institutions.

export type InstitutionStatSource = 'cash' | 'activity';
export type InstitutionStatTarget = 'power' | 'cash';

export interface InstitutionDefinition {
  nameFa: string;
  emoji: string;
  category: InstitutionCategory;
  clientCost: { stat: InstitutionStatSource; amount: number };
  /** Optional secondary cost for the client (e.g. library: cash + activity) */
  clientCost2?: { stat: InstitutionStatSource; amount: number };
  clientGain: { stat: InstitutionStatTarget; amount: number };
  providerCost?: { stat: 'activity'; amount: number };
  /** Percent (0–100) of client cash cost that goes to the provider */
  providerGainPercent?: number;
  /** Extra power earned by the provider per transaction (Industrial + Public) */
  providerGainPower?: number;
  /** Extra popularity earned by the provider per transaction (Public only) */
  providerGainPopularity?: number;
  /** True if a filled warehouse is required for this service to be active */
  requiresWarehouse?: boolean;
  /** True if a one-time license must be purchased (all non-residential) */
  licenseRequired: boolean;
  /** Building types that count as this institution */
  buildingTypes: string[];
}

export const INSTITUTION_DEFINITIONS: Record<string, InstitutionDefinition> = {
  // ── Residential ────────────────────────────────────────────────────────────
  home_rent: {
    nameFa: 'اجاره مسکن',
    emoji: '🏠',
    category: 'residential',
    clientCost: { stat: 'cash', amount: 200 },
    clientGain: { stat: 'power', amount: 5 },
    licenseRequired: false,
    buildingTypes: ['house', 'villa'],
  },

  // ── Commercial (basic) ─────────────────────────────────────────────────────
  shopping: {
    nameFa: 'خرید و پوشاک',
    emoji: '🛍️',
    category: 'commercial',
    clientCost: { stat: 'cash', amount: 300 },
    clientGain: { stat: 'power', amount: 6 },
    providerCost: { stat: 'activity', amount: 10 },
    providerGainPercent: 60,
    licenseRequired: true,
    buildingTypes: ['shop', 'market'],
  },
  cafe: {
    nameFa: 'کافه و نوشیدنی',
    emoji: '☕',
    category: 'commercial',
    clientCost: { stat: 'cash', amount: 150 },
    clientGain: { stat: 'power', amount: 3 },
    providerCost: { stat: 'activity', amount: 8 },
    providerGainPercent: 65,
    licenseRequired: true,
    buildingTypes: ['cafe'],
  },
  gym: {
    nameFa: 'باشگاه ورزشی',
    emoji: '🏋️',
    category: 'commercial',
    clientCost: { stat: 'cash', amount: 250 },
    clientGain: { stat: 'power', amount: 8 },
    providerCost: { stat: 'activity', amount: 12 },
    providerGainPercent: 58,
    licenseRequired: true,
    buildingTypes: ['gym'],
  },
  restaurant: {
    nameFa: 'رستوران',
    emoji: '🍽️',
    category: 'commercial',
    clientCost: { stat: 'cash', amount: 200 },
    clientGain: { stat: 'power', amount: 5 },
    providerCost: { stat: 'activity', amount: 10 },
    providerGainPercent: 62,
    requiresWarehouse: true,
    licenseRequired: true,
    buildingTypes: ['restaurant'],
  },
  // ── Commercial: big (requires warehouse) ──────────────────────────────────
  mall_service: {
    nameFa: 'مرکز خرید',
    emoji: '🏬',
    category: 'commercial',
    clientCost: { stat: 'cash', amount: 400 },
    clientGain: { stat: 'power', amount: 10 },
    providerCost: { stat: 'activity', amount: 15 },
    providerGainPercent: 60,
    requiresWarehouse: true,
    licenseRequired: true,
    buildingTypes: ['mall'],
  },
  // ── Commercial: library (client also pays activity) ────────────────────────
  library: {
    nameFa: 'کتابخانه و فرهنگسرا',
    emoji: '📚',
    category: 'commercial',
    clientCost: { stat: 'cash', amount: 100 },
    clientCost2: { stat: 'activity', amount: 5 },
    clientGain: { stat: 'power', amount: 7 },   // higher than base because client also pays activity
    providerCost: { stat: 'activity', amount: 6 },
    providerGainPercent: 45,
    licenseRequired: true,
    buildingTypes: ['library'],
  },
  // ── Commercial: exchange (Activity → Cash) ─────────────────────────────────
  exchange: {
    nameFa: 'بورس فعالیت',
    emoji: '🏦',
    category: 'commercial',
    clientCost: { stat: 'activity', amount: 1 },
    clientGain: { stat: 'cash', amount: 2 },  // base rate; overridden at runtime by EXCHANGE_RATES
    licenseRequired: true,
    buildingTypes: ['office', 'exchange'],
  },

  // ── Industrial ──────────────────────────────────────────────────────────────
  // Industrial providers fill warehouses; they do not have a direct client interaction.
  // Their reward comes from fill_warehouse RPC (cash + power).
  farm_supply: {
    nameFa: 'تأمین کالای مزرعه',
    emoji: '🌾',
    category: 'industrial',
    // No client side — this is provider-only; amounts represent the warehouse fill reward
    clientCost: { stat: 'cash', amount: 0 },
    clientGain: { stat: 'power', amount: 0 },
    providerGainPercent: 0,
    providerGainPower: 2,     // +2 power per warehouse fill
    licenseRequired: true,
    buildingTypes: ['farm'],
  },
  factory_supply: {
    nameFa: 'تأمین کالای کارخانه',
    emoji: '🏭',
    category: 'industrial',
    clientCost: { stat: 'cash', amount: 0 },
    clientGain: { stat: 'power', amount: 0 },
    providerGainPercent: 0,
    providerGainPower: 3,     // +3 power per warehouse fill
    licenseRequired: true,
    buildingTypes: ['factory'],
  },
  industrial_supply: {
    nameFa: 'تأمین انبار صنعتی',
    emoji: '📦',
    category: 'industrial',
    clientCost: { stat: 'cash', amount: 0 },
    clientGain: { stat: 'power', amount: 0 },
    providerGainPower: 2,
    licenseRequired: true,
    buildingTypes: ['farm', 'factory'],
  },

  // ── Public ──────────────────────────────────────────────────────────────────
  hospital: {
    nameFa: 'خدمات درمانی',
    emoji: '🏥',
    category: 'public',
    clientCost: { stat: 'cash', amount: 500 },
    clientGain: { stat: 'power', amount: 15 },
    providerCost: { stat: 'activity', amount: 20 },
    providerGainPercent: 55,
    providerGainPower: 3,
    providerGainPopularity: 2,
    licenseRequired: true,
    buildingTypes: ['hospital'],
  },
  university: {
    nameFa: 'آموزش دانشگاهی',
    emoji: '🎓',
    category: 'public',
    clientCost: { stat: 'cash', amount: 400 },
    clientGain: { stat: 'power', amount: 12 },
    providerCost: { stat: 'activity', amount: 15 },
    providerGainPercent: 50,
    providerGainPower: 2,
    providerGainPopularity: 3,
    licenseRequired: true,
    buildingTypes: ['university'],
  },
  bank_service: {
    nameFa: 'خدمات بانکی',
    emoji: '🏦',
    category: 'public',
    clientCost: { stat: 'cash', amount: 300 },
    clientGain: { stat: 'power', amount: 8 },
    providerCost: { stat: 'activity', amount: 12 },
    providerGainPercent: 48,
    providerGainPower: 1,
    providerGainPopularity: 2,
    licenseRequired: true,
    buildingTypes: ['bank'],
  },
  park_service: {
    nameFa: 'پارک و فضای سبز',
    emoji: '🌳',
    category: 'public',
    clientCost: { stat: 'cash', amount: 100 },
    clientGain: { stat: 'power', amount: 4 },
    providerCost: { stat: 'activity', amount: 8 },
    providerGainPercent: 40,
    providerGainPower: 1,
    providerGainPopularity: 4,   // parks yield higher popularity
    licenseRequired: true,
    buildingTypes: ['park'],
  },
} as const;

// ─── Economy: Exchange Rates ──────────────────────────────────────────────────

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
//
// Tiered by institution category:
//   Residential (T1): 1–5 | Commercial (T2): 1–3 | Industrial (T3): 3–4 | Public (T4): 2–4

export const DAILY_POWER_DRIP: Record<string, number> = {
  // ── Residential T1 ──
  house:      1,
  villa:      2,
  tower:      5,
  // ── Commercial T2 ──
  shop:       2,
  cafe:       2,
  gym:        2,
  warehouse:  1,
  exchange:   2,
  mall:       3,
  restaurant: 2,
  market:     2,
  office:     2,
  // ── Industrial T3 ──
  farm:       3,
  factory:    4,
  // ── Public T4 ──
  hospital:   4,
  park:       2,
  university: 4,
  bank:       3,
  // ── Legacy ──
  barracks:   8,
  // custom building types inherit the value from their custom_settings.daily_power_drip
} as const;

// ─── Economy: Popularity Boost ────────────────────────────────────────────────

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

export const ACTIVITY_EVENTS = {
  tile_load: 1,
  marketplace_view: 2,
  asset_inspect: 2,
  trade_complete: 10,
  build_complete: 8,
  upgrade_complete: 6,
  service_used: 5,
  exchange_used: 4,
  proposal_submitted: 5,
} as const;

export type ActivityEventKey = keyof typeof ACTIVITY_EVENTS;
