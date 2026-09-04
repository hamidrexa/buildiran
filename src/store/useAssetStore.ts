/**
 * BuildIran — Zustand Asset Store
 * Manages all on-map assets (buildings) with Supabase persistence.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Asset, AssetListing, BuildingType } from '@/types/game.types';

interface AssetState {
  assets: Record<string, Asset>;
  listings: AssetListing[];
  isLoadingAssets: boolean;
  isLoadingListings: boolean;

  // ─── Asset Actions ────────────────────────────────────────────────────────
  fetchMyAssets: (userId: string) => Promise<void>;
  fetchAllAssets: () => Promise<void>;
  buildAsset: (params: {
    userId: string;
    type: BuildingType;
    latitude: number;
    longitude: number;
    tileId: string;
    marketValue?: number;
    powerBonus?: number;
  }) => Promise<Asset | null>;
  upgradeAsset: (assetId: string) => Promise<boolean>;
  listForSale: (assetId: string, price: number) => Promise<boolean>;
  cancelListing: (assetId: string) => Promise<boolean>;

  // ─── Marketplace ──────────────────────────────────────────────────────────
  fetchListings: () => Promise<void>;
  buyAsset: (listingId: string, buyerId: string) => Promise<boolean>;
}

// Cost and reward table per building type
const BUILDING_CONFIG: Record<BuildingType, { cost: number; value: number; power: number }> = {
  house:     { cost: 500,   value: 800,   power: 2  },
  farm:      { cost: 800,   value: 1200,  power: 1  },
  market:    { cost: 1500,  value: 2500,  power: 3  },
  tower:     { cost: 3000,  value: 5000,  power: 15 },
  warehouse: { cost: 1000,  value: 1800,  power: 2  },
  barracks:  { cost: 4000,  value: 7000,  power: 20 },
  shop:      { cost: 1200,  value: 2000,  power: 3  },
  mall:      { cost: 5000,  value: 9000,  power: 8  },
  villa:     { cost: 3500,  value: 6000,  power: 5  },
  office:    { cost: 2500,  value: 4500,  power: 6  },
};

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
  };
}

export const useAssetStore = create<AssetState>()((set, get) => ({
  assets: {},
  listings: [],
  isLoadingAssets: false,
  isLoadingListings: false,

  fetchMyAssets: async (userId: string) => {
    set({ isLoadingAssets: true });
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('owner_id', userId);
      if (error) throw error;
      const map: Record<string, Asset> = {};
      (data ?? []).forEach((row) => {
        map[row.id] = dbRowToAsset(row);
      });
      set({ assets: map });
    } catch (err) {
      console.warn('[AssetStore] fetchMyAssets error:', err);
    } finally {
      set({ isLoadingAssets: false });
    }
  },

  fetchAllAssets: async () => {
    set({ isLoadingAssets: true });
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('built_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const map: Record<string, Asset> = {};
      (data ?? []).forEach((row) => {
        map[row.id] = dbRowToAsset(row);
      });
      set({ assets: map });
    } catch (err) {
      console.warn('[AssetStore] fetchAllAssets error:', err);
    } finally {
      set({ isLoadingAssets: false });
    }
  },

  buildAsset: async ({ userId, type, latitude, longitude, tileId, marketValue, powerBonus }) => {
    const config = (BUILDING_CONFIG as any)[type] || {
      cost: 5000,
      value: marketValue ?? 6000,
      power: powerBonus ?? 10,
    };
    try {
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
        })
        .select()
        .single();

      if (error) throw error;

      const asset = dbRowToAsset(data);
      set((state) => ({
        assets: { ...state.assets, [asset.id]: asset },
      }));

      // Log game event
      await supabase.from('game_events').insert({
        player_id: userId,
        type: 'building_built',
        payload: { asset_id: asset.id, asset_type: type, lat: latitude, lng: longitude },
      });

      return asset;
    } catch (err) {
      console.warn('[AssetStore] buildAsset error:', err);
      return null;
    }
  },

  upgradeAsset: async (assetId: string) => {
    const asset = get().assets[assetId];
    if (!asset) return false;
    try {
      const newLevel = asset.level + 1;
      const newValue = Math.floor(asset.marketValue * 1.5);
      const newPower = asset.powerBonus + 5;

      const { error } = await supabase
        .from('assets')
        .update({
          level: newLevel,
          market_value: newValue,
          power_bonus: newPower,
          upgraded_at: new Date().toISOString(),
        })
        .eq('id', assetId);

      if (error) throw error;

      set((state) => ({
        assets: {
          ...state.assets,
          [assetId]: { ...asset, level: newLevel, marketValue: newValue, powerBonus: newPower },
        },
      }));
      return true;
    } catch (err) {
      console.warn('[AssetStore] upgradeAsset error:', err);
      return false;
    }
  },

  listForSale: async (assetId: string, price: number) => {
    const asset = get().assets[assetId];
    if (!asset) return false;
    try {
      // Update asset
      const { error: assetError } = await supabase
        .from('assets')
        .update({ is_for_sale: true, ask_price: price })
        .eq('id', assetId);
      if (assetError) throw assetError;

      // Create listing
      const { error: listError } = await supabase.from('asset_listings').insert({
        asset_id: assetId,
        seller_id: asset.ownerId,
        price,
      });
      if (listError) throw listError;

      set((state) => ({
        assets: {
          ...state.assets,
          [assetId]: { ...asset, isForSale: true, askPrice: price },
        },
      }));
      return true;
    } catch (err) {
      console.warn('[AssetStore] listForSale error:', err);
      return false;
    }
  },

  cancelListing: async (assetId: string) => {
    const asset = get().assets[assetId];
    if (!asset) return false;
    try {
      await supabase
        .from('assets')
        .update({ is_for_sale: false, ask_price: null })
        .eq('id', assetId);

      await supabase
        .from('asset_listings')
        .update({ status: 'cancelled' })
        .eq('asset_id', assetId)
        .eq('status', 'active');

      set((state) => ({
        assets: {
          ...state.assets,
          [assetId]: { ...asset, isForSale: false, askPrice: null },
        },
      }));
      return true;
    } catch (err) {
      console.warn('[AssetStore] cancelListing error:', err);
      return false;
    }
  },

  fetchListings: async () => {
    set({ isLoadingListings: true });
    try {
      const { data, error } = await supabase
        .from('asset_listings')
        .select(`
          *,
          asset:assets(*),
          seller:profiles(username)
        `)
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
    } finally {
      set({ isLoadingListings: false });
    }
  },

  buyAsset: async (listingId: string, buyerId: string) => {
    const listing = get().listings.find((l) => l.id === listingId);
    if (!listing || !listing.asset) return false;
    try {
      // Transfer ownership
      await supabase
        .from('assets')
        .update({ owner_id: buyerId, is_for_sale: false, ask_price: null })
        .eq('id', listing.assetId);

      // Mark listing as sold
      await supabase
        .from('asset_listings')
        .update({ status: 'sold', buyer_id: buyerId, sold_at: new Date().toISOString() })
        .eq('id', listingId);

      // Log event
      await supabase.from('game_events').insert({
        player_id: buyerId,
        type: 'asset_sold',
        payload: { listing_id: listingId, asset_id: listing.assetId, price: listing.price },
      });

      // Remove from listing UI
      set((state) => ({
        listings: state.listings.filter((l) => l.id !== listingId),
      }));
      return true;
    } catch (err) {
      console.warn('[AssetStore] buyAsset error:', err);
      return false;
    }
  },
}));

export { BUILDING_CONFIG };
