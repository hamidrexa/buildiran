/**
 * BuildIran — Zustand Player Store
 * Current player's data, resources, and game status.
 * Syncs with Supabase profiles table.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Player, ResourceMap } from '@/types/game.types';
import { STORAGE_PLAYER_DATA } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface PlayerState {
  // ─── Player Data ─────────────────────────────────────────────────────────
  player: Player | null;
  isInitialized: boolean;

  // ─── Actions ─────────────────────────────────────────────────────────────
  setPlayer: (player: Player) => void;
  updateResources: (resources: Partial<ResourceMap>) => void;
  addOwnedTile: (tileId: string) => void;
  removeOwnedTile: (tileId: string) => void;
  addBuilding: (buildingId: string) => void;
  removeBuilding: (buildingId: string) => void;
  incrementScore: (amount: number) => void;
  setInitialized: (initialized: boolean) => void;
  clearPlayer: () => void;

  // ─── 4-Factor Stats ──────────────────────────────────────────────────────
  updateStats: (stats: {
    power?: number;
    wealth?: number;
    activity?: number;
    popularity?: number;
  }) => void;
  updateCash: (delta: number) => void;

  // ─── Supabase Sync ───────────────────────────────────────────────────────
  syncFromSupabase: (userId: string) => Promise<void>;
  syncToSupabase: () => Promise<void>;
}

function dbRowToPlayer(row: Record<string, any>): Player {
  return {
    id: row.id,
    username: row.username ?? 'بازیکن',
    avatarUrl: row.avatar_url ?? null,
    avatarColor: row.avatar_color ?? '#6C63FF',
    level: row.level ?? 1,
    experience: row.experience ?? 0,
    cash: row.cash ?? 5000,
    power: row.power ?? 10,
    wealth: row.wealth ?? 0,
    activity: row.activity ?? 0,
    popularity: row.popularity ?? 0,
    resources: {
      gold: row.cash ?? 5000,
      food: 800,
      wood: 600,
      stone: 350,
      population: 25,
    },
    ownedTileIds: [],
    buildingIds: [],
    score: row.score ?? 0,
    rank: row.rank ?? 9999,
    status: row.status ?? 'online',
    joinedAt: row.joined_at ?? new Date().toISOString(),
    lastSeenAt: row.last_seen_at ?? new Date().toISOString(),
  };
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      player: null,
      isInitialized: false,

      setPlayer: (player) => set({ player }),

      updateResources: (resources) =>
        set((state) => ({
          player: state.player
            ? {
                ...state.player,
                resources: { ...state.player.resources, ...resources },
              }
            : null,
        })),

      addOwnedTile: (tileId) =>
        set((state) => ({
          player: state.player
            ? {
                ...state.player,
                ownedTileIds: [...state.player.ownedTileIds, tileId],
              }
            : null,
        })),

      removeOwnedTile: (tileId) =>
        set((state) => ({
          player: state.player
            ? {
                ...state.player,
                ownedTileIds: state.player.ownedTileIds.filter(
                  (id) => id !== tileId,
                ),
              }
            : null,
        })),

      addBuilding: (buildingId) =>
        set((state) => ({
          player: state.player
            ? {
                ...state.player,
                buildingIds: [...state.player.buildingIds, buildingId],
              }
            : null,
        })),

      removeBuilding: (buildingId) =>
        set((state) => ({
          player: state.player
            ? {
                ...state.player,
                buildingIds: state.player.buildingIds.filter(
                  (id) => id !== buildingId,
                ),
              }
            : null,
        })),

      incrementScore: (amount) =>
        set((state) => ({
          player: state.player
            ? { ...state.player, score: state.player.score + amount }
            : null,
        })),

      setInitialized: (isInitialized) => set({ isInitialized }),

      clearPlayer: () => set({ player: null, isInitialized: false }),

      // ─── 4-Factor Stats ────────────────────────────────────────────────

      updateStats: (stats) =>
        set((state) => ({
          player: state.player ? { ...state.player, ...stats } : null,
        })),

      updateCash: (delta) =>
        set((state) => {
          if (!state.player) return {};
          const newCash = Math.max(0, state.player.cash + delta);
          return {
            player: {
              ...state.player,
              cash: newCash,
              resources: { ...state.player.resources, gold: newCash },
            },
          };
        }),

      // ─── Supabase Sync ─────────────────────────────────────────────────

      syncFromSupabase: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) throw error;
          if (!data) return;

          const player = dbRowToPlayer(data);
          set({ player, isInitialized: true });
        } catch (err) {
          console.warn('[PlayerStore] syncFromSupabase error:', err);
        }
      },

      syncToSupabase: async () => {
        const { player } = get();
        if (!player) return;
        try {
          await supabase
            .from('profiles')
            .update({
              cash: player.cash,
              activity: player.activity,
              last_seen_at: new Date().toISOString(),
              status: 'in_game',
            })
            .eq('id', player.id);
        } catch (err) {
          console.warn('[PlayerStore] syncToSupabase error:', err);
        }
      },
    }),
    {
      name: STORAGE_PLAYER_DATA,
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist core player info, not transient state
      partialize: (state) => ({ player: state.player }),
    },
  ),
);
