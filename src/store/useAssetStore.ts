/**
 * BuildIran — Zustand Asset Store
 * Manages all on-map assets (buildings) with Supabase persistence.
 * v3: Dual build modes (fast / advanced), 4-type institution categories,
 *     license fee payment, warehouse fill, Advanced Build session management.
 */

import { supabase } from '@/lib/supabase';
import type {
  Asset,
  AssetListing,
  BuildingType,
  InstitutionCategory,
  BuildMode,
  AdvancedBuildSession,
  BuildMaterialSlot,
  NearbyShopItem,
} from '@/types/game.types';
import {
  INSTITUTION_CATEGORY,
  INSTITUTION_DEFINITIONS,
  DAILY_POWER_DRIP,
  LICENSE_FEE,
  BUILD_MATERIAL_SLOTS,
  BUILD_MATERIALS,
  SUBSIDIZED_POWER_RATIO,
  ADVANCED_BUILD_NEARBY_RADIUS_METERS,
} from '@/lib/constants';
import { create } from 'zustand';

// ─── Building Config ──────────────────────────────────────────────────────────
// cost  = fast-mode build cost (land + construction, bundled)
// value = market value
// power = instant power bonus on build
// incomeRate = hourly cash income
// dailyPowerDrip = power added per day via pg_cron
// institutionType = institution code (null = no service)

export interface BuildingConfig {
  cost: number;
  value: number;
  power: number;
  incomeRate: number;
  dailyPowerDrip: number;
  institutionType: string | null;
}

const BUILDING_CONFIG: Record<string, BuildingConfig> = {
  // ── Residential T1 ──────────────────────────────────────────────────────
  house:      { cost: 500,   value: 800,   power: 2,  incomeRate: 20,  dailyPowerDrip: 1, institutionType: 'home_rent'       },
  villa:      { cost: 3500,  value: 6000,  power: 5,  incomeRate: 40,  dailyPowerDrip: 2, institutionType: 'home_rent'       },
  tower:      { cost: 8000,  value: 14000, power: 10, incomeRate: 80,  dailyPowerDrip: 5, institutionType: null              },
  // ── Commercial T2 ───────────────────────────────────────────────────────
  shop:       { cost: 1200,  value: 2000,  power: 3,  incomeRate: 60,  dailyPowerDrip: 2, institutionType: 'shopping'        },
  cafe:       { cost: 1500,  value: 2500,  power: 3,  incomeRate: 70,  dailyPowerDrip: 2, institutionType: 'cafe'            },
  gym:        { cost: 1800,  value: 3000,  power: 3,  incomeRate: 75,  dailyPowerDrip: 2, institutionType: 'gym'             },
  warehouse:  { cost: 1000,  value: 1800,  power: 2,  incomeRate: 25,  dailyPowerDrip: 1, institutionType: null              },
  exchange:   { cost: 2500,  value: 4500,  power: 4,  incomeRate: 100, dailyPowerDrip: 2, institutionType: 'exchange'        },
  mall:       { cost: 5000,  value: 9000,  power: 8,  incomeRate: 200, dailyPowerDrip: 3, institutionType: 'mall_service'    },
  restaurant: { cost: 2000,  value: 3500,  power: 4,  incomeRate: 90,  dailyPowerDrip: 2, institutionType: 'restaurant'      },
  market:     { cost: 1500,  value: 2500,  power: 3,  incomeRate: 80,  dailyPowerDrip: 2, institutionType: 'shopping'        },
  office:     { cost: 2500,  value: 4500,  power: 6,  incomeRate: 100, dailyPowerDrip: 2, institutionType: 'exchange'        },
  // ── Industrial T3 ───────────────────────────────────────────────────────
  farm:       { cost: 2000,  value: 3500,  power: 3,  incomeRate: 50,  dailyPowerDrip: 3, institutionType: 'farm_supply'     },
  factory:    { cost: 6000,  value: 10000, power: 6,  incomeRate: 150, dailyPowerDrip: 4, institutionType: 'factory_supply'  },
  // ── Public T4 ───────────────────────────────────────────────────────────
  hospital:   { cost: 8000,  value: 14000, power: 8,  incomeRate: 0,   dailyPowerDrip: 4, institutionType: 'hospital'        },
  park:       { cost: 3000,  value: 5000,  power: 4,  incomeRate: 0,   dailyPowerDrip: 2, institutionType: 'park_service'    },
  university: { cost: 10000, value: 18000, power: 10, incomeRate: 0,   dailyPowerDrip: 4, institutionType: 'university'      },
  bank:       { cost: 5000,  value: 9000,  power: 6,  incomeRate: 0,   dailyPowerDrip: 3, institutionType: 'bank_service'    },
  // ── Legacy / Military ────────────────────────────────────────────────────
  barracks:   { cost: 4000,  value: 7000,  power: 20, incomeRate: 0,   dailyPowerDrip: 8, institutionType: null              },
};

// ─── DB Row Mapper ────────────────────────────────────────────────────────────

function dbRowToAsset(row: Record<string, any>): Asset {
  return {
    id: row.id,
    ownerId: row.owner_id,
    type: row.type as BuildingType,
    latitude: row.latitude,
    longitude: row.longitude,
    tileId: row.tile_id,
    level: row.level ?? 1,
    marketValue: row.market_value ?? 1000,
    powerBonus: row.power_bonus ?? 0,
    isForSale: row.is_for_sale ?? false,
    askPrice: row.ask_price ?? null,
    builtAt: row.built_at,
    upgradedAt: row.upgraded_at ?? null,
    // Economy fields
    incomeRate: row.income_rate ?? 0,
    totalViews: row.total_views ?? 0,
    dailyPowerDrip: row.daily_power_drip ?? 0,
    institutionType: row.institution_type ?? null,
    // v3 — Build modes & institution category
    buildMode: (row.build_mode ?? 'fast') as BuildMode,
    institutionCategory: (row.institution_category ?? null) as InstitutionCategory | null,
    licensePurchased: row.license_purchased ?? false,
    warehouseFilled: row.warehouse_filled ?? false,
    // Joined owner data
    ownerUsername: row.owner?.username ?? row.profiles?.username ?? undefined,
    ownerAvatarColor: row.owner?.avatar_color ?? row.profiles?.avatar_color ?? undefined,
  };
}

// ─── Advanced Build Session builder ──────────────────────────────────────────

function buildEmptySession(
  sessionId: string,
  buildingType: string,
  latitude: number,
  longitude: number,
  tileId: string,
): AdvancedBuildSession {
  const slotDefs = BUILD_MATERIAL_SLOTS[buildingType] ?? [];
  const slots: BuildMaterialSlot[] = slotDefs.map((s) => ({
    slotId: `${s.itemId}_slot`,
    itemId: s.itemId,
    nameFa: BUILD_MATERIALS.find((m) => m.itemId === s.itemId)?.nameFa ?? s.itemId,
    qtyRequired: s.qtyRequired,
    gathered: null,
  }));
  return {
    sessionId,
    buildingType,
    latitude,
    longitude,
    tileId,
    slots,
    totalCashCost: 0,
    totalQuotaUsed: 0,
    effectivePowerRatio: 1.0,
    allGathered: slots.length === 0,
  };
}

function recomputeSession(session: AdvancedBuildSession): AdvancedBuildSession {
  let totalCash = 0;
  let totalQuota = 0;
  let sumRatio = 0;
  let gatherCount = 0;
  const allGathered = session.slots.every((s) => s.gathered !== null);

  for (const slot of session.slots) {
    if (!slot.gathered) continue;
    const g = slot.gathered;
    if (g.source === 'market') totalCash += g.unitCost * g.qty;
    if (g.source === 'subsidized') totalQuota += g.quotaCost * g.qty;
    sumRatio += g.powerRatio;
    gatherCount++;
  }

  const effectivePowerRatio = gatherCount > 0
    ? Math.round((sumRatio / gatherCount) * 1000) / 1000
    : 1.0;

  return { ...session, totalCashCost: totalCash, totalQuotaUsed: totalQuota, effectivePowerRatio, allGathered };
}

// ─── Store State ──────────────────────────────────────────────────────────────

interface AssetState {
  assets: Record<string, Asset>;
  listings: AssetListing[];
  isLoadingAssets: boolean;
  isLoadingListings: boolean;
  listingsError: string | null;

  // Advanced Build session state
  activeSession: AdvancedBuildSession | null;
  nearbyShopItems: NearbyShopItem[];
  isLoadingNearby: boolean;

  // ─── Asset Actions ────────────────────────────────────────────────────────
  fetchMyAssets: (userId: string) => Promise<void>;
  fetchAllAssets: () => Promise<void>;
  subscribeToAssets: () => () => void;

  /** Fast mode: pay full bundled cost (land + construction + license) instantly */
  buildAssetFast: (params: {
    userId: string;
    type: string;
    latitude: number;
    longitude: number;
    tileId: string;
  }) => Promise<Asset | null>;

  /** Advanced mode: create a DB session, returns sessionId */
  startAdvancedBuild: (params: {
    userId: string;
    type: string;
    latitude: number;
    longitude: number;
    tileId: string;
  }) => Promise<string | null>;

  /** Add / replace one material slot in the active session (calls RPC) */
  addMaterialToSession: (params: {
    slotId: string;
    itemId: string;
    itemNameFa: string;
    qty: number;
    source: 'market' | 'subsidized';
    unitCost: number;
    quotaCostPerUnit: number;
    shopAssetId?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  /** Confirm the active Advanced Build session (calls RPC, inserts asset) */
  confirmAdvancedBuild: () => Promise<Asset | null>;

  /** Cancel and delete the active Advanced Build session */
  cancelAdvancedBuild: () => Promise<void>;

  /** Industrial provider fills a Commercial warehouse */
  fillWarehouse: (industrialAssetId: string, commercialAssetId: string) => Promise<{ success: boolean; cashEarned?: number; powerEarned?: number; error?: string }>;

  /** Fetch market items from player-owned Commercial shops within radius */
  fetchNearbyShopItems: (latitude: number, longitude: number) => Promise<void>;

  upgradeAsset: (assetId: string) => Promise<boolean>;
  listForSale: (assetId: string, price: number) => Promise<boolean>;
  cancelListing: (assetId: string) => Promise<void>;

  // ─── Marketplace ──────────────────────────────────────────────────────────
  fetchListings: () => Promise<void>;
  buyAsset: (listingId: string, buyerId: string) => Promise<boolean>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAssetStore = create<AssetState>()((set, get) => ({
  assets: {},
  listings: [],
  isLoadingAssets: false,
  isLoadingListings: false,
  listingsError: null,
  activeSession: null,
  nearbyShopItems: [],
  isLoadingNearby: false,

  // ─── Fetch ────────────────────────────────────────────────────────────────

  fetchMyAssets: async (userId) => {
    set({ isLoadingAssets: true });
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*, owner:profiles(username, avatar_color)')
        .eq('owner_id', userId);
      if (error) throw error;
      const ownAssets: Record<string, Asset> = {};
      (data ?? []).forEach((row) => { ownAssets[row.id] = dbRowToAsset(row); });
      set((state) => {
        const merged = Object.fromEntries(
          Object.entries(state.assets).filter(([, a]) => a.ownerId !== userId),
        );
        return { assets: { ...merged, ...ownAssets } };
      });
    } catch (err) {
      console.warn('[AssetStore] fetchMyAssets error:', err);
    } finally {
      set({ isLoadingAssets: false });
    }
  },

  fetchAllAssets: async () => {
    set({ isLoadingAssets: true });
    try {
      const map: Record<string, Asset> = {};
      const pageSize = 1000;
      let page = 0, fetched = 0;
      do {
        const { data, error } = await supabase
          .from('assets')
          .select('*, owner:profiles(username, avatar_color)')
          .order('built_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        (data ?? []).forEach((row) => { map[row.id] = dbRowToAsset(row); });
        fetched = data?.length ?? 0;
        page++;
      } while (fetched === pageSize);
      set({ assets: map });
    } catch (err) {
      console.warn('[AssetStore] fetchAllAssets error:', err);
    } finally {
      set({ isLoadingAssets: false });
    }
  },

  subscribeToAssets: () => {
    const channel = supabase
      .channel('public:assets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updated = dbRowToAsset(payload.new);
          set((state) => ({
            assets: { ...state.assets, [updated.id]: { ...state.assets[updated.id], ...updated } },
          }));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.id;
          if (id) set((state) => { const next = { ...state.assets }; delete next[id]; return { assets: next }; });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  // ─── Fast Build ───────────────────────────────────────────────────────────

  buildAssetFast: async ({ userId, type, latitude, longitude, tileId }) => {
    const config = BUILDING_CONFIG[type] ?? { cost: 5000, value: 6000, power: 5, incomeRate: 0, dailyPowerDrip: 0, institutionType: null };
    const category: InstitutionCategory | null = INSTITUTION_CATEGORY[type] ?? null;
    const licenseFee = category ? LICENSE_FEE[category] : 0;

    try {
      // Insert asset into DB
      const { data, error } = await supabase
        .from('assets')
        .insert({
          owner_id: userId,
          type,
          latitude,
          longitude,
          tile_id: tileId,
          market_value: config.value,
          power_bonus: config.power,
          income_rate: config.incomeRate,
          daily_power_drip: config.dailyPowerDrip,
          institution_type: config.institutionType ?? null,
          institution_category: category,
          build_mode: 'fast',
          license_purchased: licenseFee > 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Securely deduct license fee via RPC if applicable
      if (licenseFee > 0 && data?.id) {
        const { error: rpcError } = await supabase.rpc('buy_license', {
          p_asset_id: data.id,
          p_fee: licenseFee,
        });
        if (rpcError) {
          console.warn('[AssetStore] buy_license RPC error:', rpcError);
        }
      }

      // Deduct cash + power via profile update (cash deduction includes license fee)
      // (Caller is responsible for updateCash(-totalCost) and updateStats({power: +config.power}))

      const asset = dbRowToAsset(data);
      set((state) => ({ assets: { ...state.assets, [asset.id]: asset } }));

      await supabase.from('game_events').insert({
        player_id: userId,
        type: 'building_built',
        payload: { asset_id: asset.id, asset_type: type, build_mode: 'fast', license_fee: licenseFee, lat: latitude, lng: longitude },
      });

      return asset;
    } catch (err) {
      console.warn('[AssetStore] buildAssetFast error:', err);
      return null;
    }
  },

  // ─── Advanced Build ───────────────────────────────────────────────────────

  startAdvancedBuild: async ({ userId, type, latitude, longitude, tileId }) => {
    try {
      const { data, error } = await supabase.rpc('start_advanced_build', {
        p_building_type: type,
        p_latitude: latitude,
        p_longitude: longitude,
        p_tile_id: tileId,
      });
      if (error) throw error;
      const sessionId = data as string;
      if (!sessionId) return null;

      const session = buildEmptySession(sessionId, type, latitude, longitude, tileId);
      set({ activeSession: session });
      return sessionId;
    } catch (err) {
      console.warn('[AssetStore] startAdvancedBuild error:', err);
      return null;
    }
  },

  addMaterialToSession: async ({ slotId, itemId, itemNameFa, qty, source, unitCost, quotaCostPerUnit, shopAssetId }) => {
    const { activeSession } = get();
    if (!activeSession) return { success: false, error: 'no_active_session' };

    const powerRatio = source === 'subsidized' ? SUBSIDIZED_POWER_RATIO : 1.0;
    const quotaCost = source === 'subsidized' ? quotaCostPerUnit : 0;

    try {
      const { data, error } = await supabase.rpc('add_material_to_session', {
        p_session_id:    activeSession.sessionId,
        p_slot_id:       slotId,
        p_item_id:       itemId,
        p_item_name_fa:  itemNameFa,
        p_qty:           qty,
        p_source:        source,
        p_unit_cost:     source === 'market' ? unitCost : 0,
        p_quota_cost:    quotaCost,
        p_power_ratio:   powerRatio,
        p_shop_asset_id: shopAssetId ?? null,
      });

      if (error) throw error;
      if (!data?.success) return { success: false, error: data?.error ?? 'rpc_error' };

      // Update local session
      const updatedSlots = activeSession.slots.map((s) =>
        s.slotId === slotId
          ? { ...s, gathered: { source, shopAssetId, unitCost, qty, powerRatio, quotaCost } }
          : s,
      );
      const updated = recomputeSession({ ...activeSession, slots: updatedSlots });
      set({ activeSession: updated });

      return { success: true };
    } catch (err) {
      console.warn('[AssetStore] addMaterialToSession error:', err);
      return { success: false, error: 'network_error' };
    }
  },

  confirmAdvancedBuild: async () => {
    const { activeSession } = get();
    if (!activeSession) return null;

    const config = BUILDING_CONFIG[activeSession.buildingType] ?? {
      cost: 5000, value: 6000, power: 5, incomeRate: 0, dailyPowerDrip: 0, institutionType: null,
    };
    const type = activeSession.buildingType;
    const category: InstitutionCategory | null = INSTITUTION_CATEGORY[type] ?? null;
    const licenseFee = category ? LICENSE_FEE[category] : 0;

    try {
      const { data, error } = await supabase.rpc('confirm_advanced_build', {
        p_session_id:       activeSession.sessionId,
        p_base_power_bonus: config.power,
        p_market_value:     config.value,
        p_income_rate:      config.incomeRate,
        p_daily_power_drip: config.dailyPowerDrip,
        p_institution_type: config.institutionType ?? '',
        p_institution_cat:  category ?? '',
        p_license_fee:      licenseFee,
      });

      if (error) throw error;
      if (!data?.success) {
        console.warn('[AssetStore] confirmAdvancedBuild RPC error:', data?.error);
        return null;
      }

      // Fetch the newly created asset
      const assetId = data.assetId as string;
      const { data: assetRow } = await supabase
        .from('assets')
        .select('*, owner:profiles(username, avatar_color)')
        .eq('id', assetId)
        .single();

      set({ activeSession: null });

      if (!assetRow) return null;
      const asset = dbRowToAsset(assetRow);
      set((state) => ({ assets: { ...state.assets, [asset.id]: asset } }));
      return asset;
    } catch (err) {
      console.warn('[AssetStore] confirmAdvancedBuild error:', err);
      return null;
    }
  },

  cancelAdvancedBuild: async () => {
    const { activeSession } = get();
    if (!activeSession) return;
    try {
      await supabase
        .from('build_material_sessions')
        .delete()
        .eq('id', activeSession.sessionId);
    } catch (err) {
      console.warn('[AssetStore] cancelAdvancedBuild error:', err);
    } finally {
      set({ activeSession: null });
    }
  },

  // ─── Warehouse Fill ───────────────────────────────────────────────────────

  fillWarehouse: async (industrialAssetId, commercialAssetId) => {
    const indAsset = get().assets[industrialAssetId];
    const comAsset = get().assets[commercialAssetId];
    if (!indAsset || !comAsset) return { success: false, error: 'asset_not_found' };

    // Reward amounts based on industrial type
    const config = BUILDING_CONFIG[indAsset.type] ?? BUILDING_CONFIG['farm'];
    const cashReward = Math.floor(config.cost * 0.05);   // 5% of build cost
    const powerReward = INSTITUTION_DEFINITIONS[indAsset.institutionType ?? '']?.providerGainPower ?? 2;

    try {
      const { data, error } = await supabase.rpc('fill_warehouse', {
        p_industrial_asset_id: industrialAssetId,
        p_commercial_asset_id: commercialAssetId,
        p_cash_reward:         cashReward,
        p_power_reward:        powerReward,
      });
      if (error) throw error;
      if (!data?.success) return { success: false, error: data?.error };

      // Update local warehouse state
      set((state) => ({
        assets: {
          ...state.assets,
          [commercialAssetId]: { ...state.assets[commercialAssetId], warehouseFilled: true },
        },
      }));

      return { success: true, cashEarned: data.cashEarned, powerEarned: data.powerEarned };
    } catch (err) {
      console.warn('[AssetStore] fillWarehouse error:', err);
      return { success: false, error: 'network_error' };
    }
  },

  // ─── Nearby Shop Items ────────────────────────────────────────────────────

  fetchNearbyShopItems: async (latitude, longitude) => {
    set({ isLoadingNearby: true, nearbyShopItems: [] });
    try {
      // Use a simple lat/lng bounding box approximation for the nearby query
      // (500m ≈ 0.0045° latitude, 0.0054° longitude at Tehran)
      const R = ADVANCED_BUILD_NEARBY_RADIUS_METERS;
      const latDelta = R / 111320;
      const lngDelta = R / (111320 * Math.cos((latitude * Math.PI) / 180));

      const { data: nearbyAssets } = await supabase
        .from('assets')
        .select('id, owner_id, type, institution_category, owner:profiles(username)')
        .eq('institution_category', 'commercial')
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lngDelta)
        .lte('longitude', longitude + lngDelta);

      if (!nearbyAssets?.length) {
        set({ nearbyShopItems: [], isLoadingNearby: false });
        return;
      }

      const assetIds = nearbyAssets.map((a) => a.id);
      const { data: items } = await supabase
        .from('market_items')
        .select('*')
        .in('asset_id', assetIds)
        .gt('stock', 0);

      const ownerMap: Record<string, string> = {};
      for (const a of nearbyAssets) {
        ownerMap[a.id] = (a as any).owner?.username ?? 'ناشناس';
      }

      const shopItems: NearbyShopItem[] = (items ?? []).map((row) => ({
        shopAssetId: row.asset_id,
        shopOwnerUsername: ownerMap[row.asset_id] ?? 'ناشناس',
        itemId: row.item_id,
        nameFa: row.name_fa,
        price: row.unit_price,
        stock: row.stock,
      }));

      set({ nearbyShopItems: shopItems });
    } catch (err) {
      console.warn('[AssetStore] fetchNearbyShopItems error:', err);
    } finally {
      set({ isLoadingNearby: false });
    }
  },

  // ─── Upgrade ──────────────────────────────────────────────────────────────

  upgradeAsset: async (assetId) => {
    const asset = get().assets[assetId];
    if (!asset) return false;
    try {
      const newLevel = asset.level + 1;
      const newValue = Math.floor(asset.marketValue * 1.5);
      const newPower = asset.powerBonus + 5;
      const { error } = await supabase
        .from('assets')
        .update({ level: newLevel, market_value: newValue, power_bonus: newPower, upgraded_at: new Date().toISOString() })
        .eq('id', assetId);
      if (error) throw error;
      set((state) => ({
        assets: { ...state.assets, [assetId]: { ...asset, level: newLevel, marketValue: newValue, powerBonus: newPower } },
      }));
      return true;
    } catch (err) {
      console.warn('[AssetStore] upgradeAsset error:', err);
      return false;
    }
  },

  listForSale: async (assetId, price) => {
    const asset = get().assets[assetId];
    if (!asset) return false;
    try {
      const { data, error } = await supabase.rpc('list_asset_for_sale', { p_asset_id: assetId, p_price: price });
      if (error) throw error;
      if (data !== true) throw new Error('listing failed');
      set((state) => ({
        assets: { ...state.assets, [assetId]: { ...asset, isForSale: true, askPrice: price } },
      }));
      return true;
    } catch (err) {
      console.warn('[AssetStore] listForSale error:', err);
      return false;
    }
  },

  cancelListing: async (assetId) => {
    const asset = get().assets[assetId];
    if (!asset) return;
    try {
      await supabase.from('assets').update({ is_for_sale: false, ask_price: null }).eq('id', assetId);
      await supabase.from('asset_listings').update({ status: 'cancelled' }).eq('asset_id', assetId).eq('status', 'active');
      set((state) => ({
        assets: { ...state.assets, [assetId]: { ...asset, isForSale: false, askPrice: null } },
      }));
    } catch (err) {
      console.warn('[AssetStore] cancelListing error:', err);
    }
  },

  // ─── Marketplace ──────────────────────────────────────────────────────────

  fetchListings: async () => {
    set({ isLoadingListings: true, listingsError: null });
    try {
      const { data, error } = await supabase
        .from('asset_listings')
        .select(`*, asset:assets!asset_listings_asset_id_fkey(*), seller:profiles!asset_listings_seller_id_fkey(username)`)
        .eq('status', 'active')
        .order('listed_at', { ascending: false });
      if (error) throw error;
      const listings: AssetListing[] = (data ?? []).map((row) => ({
        id: row.id,
        assetId: row.asset_id,
        sellerId: row.seller_id,
        buyerId: row.buyer_id ?? null,
        price: row.price,
        status: row.status,
        listedAt: row.listed_at,
        soldAt: row.sold_at ?? null,
        asset: row.asset ? dbRowToAsset(row.asset) : undefined,
        sellerUsername: row.seller?.username ?? 'ناشناس',
      }));
      set({ listings });
    } catch (err) {
      console.warn('[AssetStore] fetchListings error:', err);
      set({ listingsError: err instanceof Error ? err.message : 'خطا در بارگذاری آگهی‌ها' });
    } finally {
      set({ isLoadingListings: false });
    }
  },

  buyAsset: async (listingId, buyerId) => {
    const listing = get().listings.find((l) => l.id === listingId);
    if (!listing || !listing.asset) return false;
    try {
      const { data, error } = await supabase.rpc('buy_asset_listing', { p_listing_id: listingId });
      if (error || data !== true) throw error ?? new Error('trade failed');
      set((state) => ({
        listings: state.listings.filter((l) => l.id !== listingId),
        assets: {
          ...state.assets,
          [listing.assetId]: { ...state.assets[listing.assetId], ownerId: buyerId, isForSale: false, askPrice: null },
        },
      }));
      return true;
    } catch (err) {
      console.warn('[AssetStore] buyAsset error:', err);
      return false;
    }
  },
}));

export { BUILDING_CONFIG };
