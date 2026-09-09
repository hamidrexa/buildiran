/**
 * BuildIran — Zustand Economy Store
 * Central engine for all 4-factor economy operations:
 *   • Institution usage (service_transactions)
 *   • Popularity boost activation
 *   • Engagement dashboard data
 *   • Exchange rate resolution
 *   • Active boost queries
 */

import { supabase } from '@/lib/supabase';
import {
  EXCHANGE_RATES,
  ESTABLISHED_BIZ_MIN_LEVEL,
  ESTABLISHED_BIZ_DAYS,
  INSTITUTION_DEFINITIONS,
  POPULARITY_BOOST_BASE_COST,
  POPULARITY_BOOST_DURATION_HOURS,
  getPlayerTier,
} from '@/lib/constants';
import type {
  InstitutionType,
  ServiceResult,
  PopularityBoost,
  EngagementData,
} from '@/types/game.types';
import { create } from 'zustand';
import { usePlayerStore } from './usePlayerStore';
import { useAssetStore } from './useAssetStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExchangeRateKey = 'base' | 'ownerBonus' | 'establishedBusiness';

interface EconomyState {
  // ─── Active boosts (keyed by assetId) ────────────────────────────────────
  activeBoosts: Record<string, PopularityBoost>;
  // ─── Engagement data (keyed by assetId) ──────────────────────────────────
  engagementData: Record<string, EngagementData>;
  isLoadingBoosts: boolean;
  isLoadingEngagement: boolean;
  lastServiceResult: ServiceResult | null;

  // ─── Institution Actions ──────────────────────────────────────────────────
  useInstitution: (assetId: string, institutionType: InstitutionType) => Promise<ServiceResult>;

  // ─── Exchange ─────────────────────────────────────────────────────────────
  resolveExchangeRate: (playerId: string) => Promise<ExchangeRateKey>;
  exchangeActivity: (amount: number, rateKey: ExchangeRateKey) => Promise<boolean>;

  // ─── Popularity Boost ─────────────────────────────────────────────────────
  activateBoost: (assetId: string) => Promise<{ success: boolean; error?: string }>;
  fetchActiveBoosts: (playerId: string) => Promise<void>;
  getBoostCost: (assetLevel: number) => number;
  isAssetBoosted: (assetId: string) => boolean;

  // ─── Viewport Views ───────────────────────────────────────────────────────
  recordViewportViews: (views: Array<{ assetId: string; viewerId: string; ownerId: string }>) => Promise<void>;

  // ─── Engagement Dashboard ─────────────────────────────────────────────────
  fetchEngagement: (assetId: string) => Promise<void>;

  // ─── Utilities ────────────────────────────────────────────────────────────
  resolvePlayerTier: (power: number) => ReturnType<typeof getPlayerTier>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEconomyStore = create<EconomyState>()((set, get) => ({
  activeBoosts: {},
  engagementData: {},
  isLoadingBoosts: false,
  isLoadingEngagement: false,
  lastServiceResult: null,

  // ─── Use Institution ────────────────────────────────────────────────────

  useInstitution: async (assetId, institutionType) => {
    const def = INSTITUTION_DEFINITIONS[institutionType];
    if (!def) {
      return { success: false, clientCostStat: 'cash', clientCostAmount: 0, clientGainStat: 'power', clientGainAmount: 0 };
    }

    // Build RPC args from definition
    const clientCostStat   = def.clientCost.stat;
    const clientCostAmt    = def.clientCost.amount;
    const clientGainStat   = def.clientGain.stat;
    const clientGainAmt    = def.clientGain.amount;
    const providerActivity = def.providerCost?.amount ?? 0;

    // Compute provider cash share (% of client cash cost)
    const providerCashShare = def.providerGainPercent && clientCostStat === 'cash'
      ? Math.floor(clientCostAmt * (def.providerGainPercent / 100))
      : 0;

    try {
      const { data, error } = await supabase.rpc('use_institution', {
        p_asset_id:             assetId,
        p_institution_type:     institutionType,
        p_client_cost_stat:     clientCostStat,
        p_client_cost_amt:      clientCostAmt,
        p_client_gain_stat:     clientGainStat,
        p_client_gain_amt:      clientGainAmt,
        p_provider_activity_cost: providerActivity,
        p_provider_cash_share:  providerCashShare,
      });

      if (error) throw error;
      if (!data?.success) {
        const result: ServiceResult = {
          success: false,
          clientCostStat,
          clientCostAmount: clientCostAmt,
          clientGainStat,
          clientGainAmount: clientGainAmt,
        };
        set({ lastServiceResult: result });
        return result;
      }

      // Optimistic local stat update
      const playerStore = usePlayerStore.getState();
      if (clientCostStat === 'cash') {
        playerStore.updateCash(-clientCostAmt);
      } else {
        playerStore.updateStats({ activity: Math.max(0, (playerStore.player?.activity ?? 0) - clientCostAmt) });
      }
      if (clientGainStat === 'power') {
        playerStore.updateStats({ power: (playerStore.player?.power ?? 0) + clientGainAmt });
      } else {
        playerStore.updateCash(clientGainAmt);
      }

      const result: ServiceResult = {
        success: true,
        clientCostStat,
        clientCostAmount: clientCostAmt,
        clientGainStat,
        clientGainAmount: clientGainAmt,
        providerCashEarned: providerCashShare,
      };
      set({ lastServiceResult: result });
      return result;
    } catch (err) {
      console.warn('[EconomyStore] useInstitution error:', err);
      const result: ServiceResult = {
        success: false,
        clientCostStat,
        clientCostAmount: clientCostAmt,
        clientGainStat,
        clientGainAmount: clientGainAmt,
      };
      set({ lastServiceResult: result });
      return result;
    }
  },

  // ─── Exchange Rate Resolution ───────────────────────────────────────────

  resolveExchangeRate: async (playerId) => {
    try {
      // Check if player owns an established business (level >= 2, used within 7 days)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - ESTABLISHED_BIZ_DAYS);

      const { data: establishedAssets } = await supabase
        .from('assets')
        .select('id, level, upgraded_at, built_at, institution_type')
        .eq('owner_id', playerId)
        .not('institution_type', 'is', null)
        .gte('level', ESTABLISHED_BIZ_MIN_LEVEL);

      if (establishedAssets && establishedAssets.length > 0) {
        // Check if any were recently used (check service_transactions)
        const assetIds = establishedAssets.map((a) => a.id);
        const { data: recentTx } = await supabase
          .from('service_transactions')
          .select('business_asset_id')
          .in('business_asset_id', assetIds)
          .gte('created_at', cutoff.toISOString())
          .limit(1);

        if (recentTx && recentTx.length > 0) {
          return 'establishedBusiness';
        }
      }

      // Check if player owns any business at all
      const { data: anyBiz } = await supabase
        .from('assets')
        .select('id')
        .eq('owner_id', playerId)
        .not('institution_type', 'is', null)
        .limit(1);

      if (anyBiz && anyBiz.length > 0) {
        return 'ownerBonus';
      }

      return 'base';
    } catch (err) {
      console.warn('[EconomyStore] resolveExchangeRate error:', err);
      return 'base';
    }
  },

  exchangeActivity: async (amount, rateKey) => {
    const rate = EXCHANGE_RATES[rateKey];
    const cashEarned = Math.floor(amount * rate);
    const playerStore = usePlayerStore.getState();
    const player = playerStore.player;
    if (!player) return false;
    if (player.activity < amount) return false;

    // Call use_institution with exchange definition
    const def = INSTITUTION_DEFINITIONS['exchange'];
    try {
      const { data, error } = await supabase.rpc('use_institution', {
        p_asset_id:               '00000000-0000-0000-0000-000000000000', // system asset placeholder
        p_institution_type:       'exchange',
        p_client_cost_stat:       'activity',
        p_client_cost_amt:        amount,
        p_client_gain_stat:       'cash',
        p_client_gain_amt:        cashEarned,
        p_provider_activity_cost: 0,
        p_provider_cash_share:    0,
      });
      if (error) throw error;
      if (!data?.success) return false;

      // Optimistic update
      playerStore.updateStats({ activity: Math.max(0, player.activity - amount) });
      playerStore.updateCash(cashEarned);
      return true;
    } catch (err) {
      console.warn('[EconomyStore] exchangeActivity error:', err);
      return false;
    }
  },

  // ─── Popularity Boost ──────────────────────────────────────────────────

  getBoostCost: (assetLevel) => POPULARITY_BOOST_BASE_COST * assetLevel,

  isAssetBoosted: (assetId) => {
    const boost = get().activeBoosts[assetId];
    if (!boost) return false;
    return new Date(boost.expiresAt) > new Date();
  },

  activateBoost: async (assetId) => {
    try {
      const { data, error } = await supabase.rpc('activate_popularity_boost', {
        p_asset_id: assetId,
      });
      if (error) throw error;
      if (!data?.success) {
        return { success: false, error: data?.error ?? 'unknown_error' };
      }

      // Deduct popularity locally
      const playerStore = usePlayerStore.getState();
      const cost = data.popularity_spent as number;
      playerStore.updateStats({
        popularity: Math.max(0, (playerStore.player?.popularity ?? 0) - cost),
      });

      // Store boost locally
      const boost: PopularityBoost = {
        id: '',
        assetId,
        ownerId: playerStore.player?.id ?? '',
        popularitySpent: cost,
        assetLevel: useAssetStore.getState().assets[assetId]?.level ?? 1,
        activatedAt: new Date().toISOString(),
        expiresAt: data.expires_at as string,
        isActive: true,
      };
      set((state) => ({
        activeBoosts: { ...state.activeBoosts, [assetId]: boost },
      }));

      return { success: true };
    } catch (err) {
      console.warn('[EconomyStore] activateBoost error:', err);
      return { success: false, error: 'rpc_error' };
    }
  },

  fetchActiveBoosts: async (playerId) => {
    set({ isLoadingBoosts: true });
    try {
      const { data, error } = await supabase
        .from('popularity_boosts')
        .select('*')
        .eq('owner_id', playerId)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      const boostedMap: Record<string, PopularityBoost> = {};
      (data ?? []).forEach((row) => {
        boostedMap[row.asset_id] = {
          id: row.id,
          assetId: row.asset_id,
          ownerId: row.owner_id,
          popularitySpent: row.popularity_spent,
          assetLevel: row.asset_level,
          activatedAt: row.activated_at,
          expiresAt: row.expires_at,
          isActive: new Date(row.expires_at) > new Date(),
        };
      });
      set({ activeBoosts: boostedMap });
    } catch (err) {
      console.warn('[EconomyStore] fetchActiveBoosts error:', err);
    } finally {
      set({ isLoadingBoosts: false });
    }
  },

  // ─── Viewport Views ────────────────────────────────────────────────────

  recordViewportViews: async (views) => {
    if (!views.length) return;
    try {
      await supabase.rpc('record_asset_views', {
        p_views: JSON.stringify(views),
      });
      // Optimistically increment popularity in local store if viewer is the current player
      const playerStore = usePlayerStore.getState();
      const myId = playerStore.player?.id;
      // If some views were of MY assets, refresh from Supabase on next sync cycle
      // (popularity update happens server-side for the owner)
    } catch (err) {
      console.warn('[EconomyStore] recordViewportViews error:', err);
    }
  },

  // ─── Engagement Dashboard ──────────────────────────────────────────────

  fetchEngagement: async (assetId) => {
    set({ isLoadingEngagement: true });
    try {
      const { data, error } = await supabase.rpc('get_engagement_data', {
        p_asset_id: assetId,
      });
      if (error) throw error;
      if (!data) return;

      const engagement: EngagementData = {
        assetId: data.assetId,
        viewsToday: data.viewsToday ?? 0,
        viewsThisWeek: data.viewsThisWeek ?? 0,
        viewsAllTime: data.viewsAllTime ?? 0,
        popularityEarned: data.popularityEarned ?? 0,
        topViewers: data.topViewers ?? [],
        upgradeSuggestion:
          (data.viewsAllTime ?? 0) < 10
            ? 'ارتقای سازه باعث جذب بازدیدکنندگان بیشتری می‌شود'
            : undefined,
      };

      set((state) => ({
        engagementData: { ...state.engagementData, [assetId]: engagement },
      }));
    } catch (err) {
      console.warn('[EconomyStore] fetchEngagement error:', err);
    } finally {
      set({ isLoadingEngagement: false });
    }
  },

  // ─── Utilities ──────────────────────────────────────────────────────────

  resolvePlayerTier: (power) => getPlayerTier(power),
}));
