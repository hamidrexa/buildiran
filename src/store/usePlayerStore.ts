/**
 * BuildIran — Zustand Player Store
 * Current player's data, resources, and game status.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Player, ResourceMap } from '@/types/game.types';
import { STORAGE_PLAYER_DATA } from '@/lib/constants';

interface PlayerState {
  // ─── Player Data ───────────────────────────────────────────────────────────
  player: Player | null;
  isInitialized: boolean;

  // ─── Actions ───────────────────────────────────────────────────────────────
  setPlayer: (player: Player) => void;
  updateResources: (resources: Partial<ResourceMap>) => void;
  addOwnedTile: (tileId: string) => void;
  removeOwnedTile: (tileId: string) => void;
  addBuilding: (buildingId: string) => void;
  removeBuilding: (buildingId: string) => void;
  incrementScore: (amount: number) => void;
  setInitialized: (initialized: boolean) => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: STORAGE_PLAYER_DATA,
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist core player info, not transient state
      partialize: (state) => ({ player: state.player }),
    },
  ),
);
