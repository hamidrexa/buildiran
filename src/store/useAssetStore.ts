/**
 * BuildIran — Zustand Asset Store
 * Manages all on-map assets (buildings) with Supabase persistence.
 */

import { supabase } from "@/lib/supabase";
import type { Asset, AssetListing, BuildingType } from "@/types/game.types";
import { create } from "zustand";

interface AssetState {
  assets: Record<string, Asset>;
  listings: AssetListing[];
  isLoadingAssets: boolean;
  isLoadingListings: boolean;
  listingsError: string | null;

  // ─── Asset Actions ────────────────────────────────────────────────────────
  fetchMyAssets: (userId: string) => Promise<void>;
  fetchAllAssets: () => Promise<void>;
  subscribeToAssets: () => () => void;
  buildAsset: (params: {
    userId: string;
    type: BuildingType | string;
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
const BUILDING_CONFIG: Record<
  BuildingType,
  { cost: number; value: number; power: number; incomeRate: number; dailyPowerDrip: number; institutionType: string | null }
> = {
  house:     { cost: 500,  value: 800,  power: 2,  incomeRate: 20,  dailyPowerDrip: 1, institutionType: 'home_rent' },
  farm:      { cost: 800,  value: 1200, power: 1,  incomeRate: 30,  dailyPowerDrip: 1, institutionType: null },
  market:    { cost: 1500, value: 2500, power: 3,  incomeRate: 80,  dailyPowerDrip: 2, institutionType: 'shopping' },
  tower:     { cost: 3000, value: 5000, power: 15, incomeRate: 50,  dailyPowerDrip: 5, institutionType: 'exchange' },
  warehouse: { cost: 1000, value: 1800, power: 2,  incomeRate: 25,  dailyPowerDrip: 1, institutionType: null },
  barracks:  { cost: 4000, value: 7000, power: 20, incomeRate: 0,   dailyPowerDrip: 8, institutionType: null },
  shop:      { cost: 1200, value: 2000, power: 3,  incomeRate: 60,  dailyPowerDrip: 2, institutionType: 'shopping' },
  mall:      { cost: 5000, value: 9000, power: 8,  incomeRate: 200, dailyPowerDrip: 3, institutionType: 'shopping' },
  villa:     { cost: 3500, value: 6000, power: 5,  incomeRate: 40,  dailyPowerDrip: 2, institutionType: 'home_rent' },
  office:    { cost: 2500, value: 4500, power: 6,  incomeRate: 100, dailyPowerDrip: 2, institutionType: 'exchange' },
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
    // Economy fields
    incomeRate: row.income_rate ?? 0,
    totalViews: row.total_views ?? 0,
    dailyPowerDrip: row.daily_power_drip ?? 0,
    institutionType: row.institution_type ?? null,
    // Joined owner data
    ownerUsername: row.owner?.username ?? row.profiles?.username ?? undefined,
    ownerAvatarColor:
      row.owner?.avatar_color ?? row.profiles?.avatar_color ?? undefined,
  };
}

export const useAssetStore = create<AssetState>()((set, get) => ({
  assets: {},
  listings: [],
  isLoadingAssets: false,
  isLoadingListings: false,
  listingsError: null,

  fetchMyAssets: async (userId: string) => {
    set({ isLoadingAssets: true });
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*, owner:profiles(username, avatar_color)")
        .eq("owner_id", userId);
      if (error) throw error;
      const ownAssets: Record<string, Asset> = {};
      (data ?? []).forEach((row) => {
        ownAssets[row.id] = dbRowToAsset(row);
      });
      set((state) => {
        // This action serves the private asset screen, but the same store is
        // also the map's global asset cache. Preserve assets owned by others.
        const mergedAssets = Object.fromEntries(
          Object.entries(state.assets).filter(
            ([, asset]) => asset.ownerId !== userId,
          ),
        );
        return { assets: { ...mergedAssets, ...ownAssets } };
      });
    } catch (err) {
      console.warn("[AssetStore] fetchMyAssets error:", err);
    } finally {
      set({ isLoadingAssets: false });
    }
  },

  fetchAllAssets: async () => {
    set({ isLoadingAssets: true });
    try {
      const map: Record<string, Asset> = {};

      const pageSize = 1000;
      let page = 0;
      let fetchedCount = 0;

      do {
        const { data, error } = await supabase
          .from("assets")
          .select("*, owner:profiles(username, avatar_color)")
          .order("built_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;

        (data ?? []).forEach((row) => {
          map[row.id] = dbRowToAsset(row);
        });
        fetchedCount = data?.length ?? 0;
        page += 1;
      } while (fetchedCount === pageSize);

      set({ assets: map });
    } catch (err) {
      console.warn("[AssetStore] fetchAllAssets error:", err);
    } finally {
      set({ isLoadingAssets: false });
    }
  },

  subscribeToAssets: () => {
    const channel = supabase
      .channel("public:assets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assets" },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const updatedAsset = dbRowToAsset(payload.new);
            set((state) => ({
              assets: {
                ...state.assets,
                [updatedAsset.id]: {
                  ...state.assets[updatedAsset.id],
                  ...updatedAsset,
                },
              },
            }));
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              set((state) => {
                const next = { ...state.assets };
                delete next[deletedId];
                return { assets: next };
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  buildAsset: async ({
    userId,
    type,
    latitude,
    longitude,
    tileId,
    marketValue,
    powerBonus,
  }) => {
    const config = (BUILDING_CONFIG as any)[type] || {
      cost: 5000,
      value: marketValue ?? 6000,
      power: powerBonus ?? 10,
    };
    try {
      const { data, error } = await supabase
        .from("assets")
        .insert({
          owner_id: userId,
          type,
          latitude,
          longitude,
          tile_id: tileId,
          market_value: config.value,
          power_bonus: config.power,
          income_rate: config.incomeRate ?? 0,
          daily_power_drip: config.dailyPowerDrip ?? 0,
          institution_type: config.institutionType ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      const asset = dbRowToAsset(data);
      set((state) => ({
        assets: { ...state.assets, [asset.id]: asset },
      }));

      // Log game event
      await supabase.from("game_events").insert({
        player_id: userId,
        type: "building_built",
        payload: {
          asset_id: asset.id,
          asset_type: type,
          lat: latitude,
          lng: longitude,
        },
      });

      return asset;
    } catch (err) {
      console.warn("[AssetStore] buildAsset error:", err);
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
        .from("assets")
        .update({
          level: newLevel,
          market_value: newValue,
          power_bonus: newPower,
          upgraded_at: new Date().toISOString(),
        })
        .eq("id", assetId);

      if (error) throw error;

      set((state) => ({
        assets: {
          ...state.assets,
          [assetId]: {
            ...asset,
            level: newLevel,
            marketValue: newValue,
            powerBonus: newPower,
          },
        },
      }));
      return true;
    } catch (err) {
      console.warn("[AssetStore] upgradeAsset error:", err);
      return false;
    }
  },

  listForSale: async (assetId: string, price: number) => {
    const asset = get().assets[assetId];
    if (!asset) return false;
    try {
      const { data, error } = await supabase.rpc("list_asset_for_sale", {
        p_asset_id: assetId,
        p_price: price,
      });
      if (error) throw error;
      if (data !== true) {
        throw new Error("The asset could not be listed for sale");
      }

      set((state) => ({
        assets: {
          ...state.assets,
          [assetId]: { ...asset, isForSale: true, askPrice: price },
        },
      }));
      return true;
    } catch (err) {
      console.warn("[AssetStore] listForSale error:", err);
      return false;
    }
  },

  cancelListing: async (assetId: string) => {
    const asset = get().assets[assetId];
    if (!asset) return false;
    try {
      await supabase
        .from("assets")
        .update({ is_for_sale: false, ask_price: null })
        .eq("id", assetId);

      await supabase
        .from("asset_listings")
        .update({ status: "cancelled" })
        .eq("asset_id", assetId)
        .eq("status", "active");

      set((state) => ({
        assets: {
          ...state.assets,
          [assetId]: { ...asset, isForSale: false, askPrice: null },
        },
      }));
      return true;
    } catch (err) {
      console.warn("[AssetStore] cancelListing error:", err);
      return false;
    }
  },

  fetchListings: async () => {
    set({ isLoadingListings: true, listingsError: null });
    try {
      const { data, error } = await supabase
        .from("asset_listings")
        .select(
          `
          *,
          asset:assets!asset_listings_asset_id_fkey(*),
          seller:profiles!asset_listings_seller_id_fkey(username)
        `,
        )
        .eq("status", "active")
        .order("listed_at", { ascending: false });

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
        sellerUsername: row.seller?.username ?? "ناشناس",
      }));

      set({ listings });
    } catch (err) {
      console.warn("[AssetStore] fetchListings error:", err);
      set({
        listingsError:
          err instanceof Error
            ? err.message
            : "Unable to load marketplace listings",
      });
    } finally {
      set({ isLoadingListings: false });
    }
  },

  buyAsset: async (listingId: string, buyerId: string) => {
    const listing = get().listings.find((l) => l.id === listingId);
    if (!listing || !listing.asset) return false;
    try {
      const { data, error } = await supabase.rpc("buy_asset_listing", {
        p_listing_id: listingId,
      });
      if (error || data !== true)
        throw error ?? new Error("Trade was not completed");

      // Remove from listing UI
      set((state) => ({
        listings: state.listings.filter((l) => l.id !== listingId),
        assets: {
          ...state.assets,
          [listing.assetId]: {
            ...state.assets[listing.assetId],
            ownerId: buyerId,
            isForSale: false,
            askPrice: null,
          },
        },
      }));
      return true;
    } catch (err) {
      console.warn("[AssetStore] buyAsset error:", err);
      return false;
    }
  },
}));

export { BUILDING_CONFIG };
