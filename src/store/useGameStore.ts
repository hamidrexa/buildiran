/**
 * BuildIran — Zustand Game Store
 * Single source of truth for world state: tiles, buildings, events.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameTile, Building, GameEvent, WorldState } from '@/types/game.types';

interface GameState {
  // ─── World State ───────────────────────────────────────────────────────────
  tiles: Record<string, GameTile>;
  buildings: Record<string, Building>;
  recentEvents: GameEvent[];

  // ─── UI State ──────────────────────────────────────────────────────────────
  selectedTileId: string | null;
  isLoading: boolean;
  error: string | null;

  // ─── Actions ───────────────────────────────────────────────────────────────
  setWorldState: (state: Partial<WorldState>) => void;
  upsertTile: (tile: GameTile) => void;
  upsertBuilding: (building: Building) => void;
  removeTile: (tileId: string) => void;
  removeBuilding: (buildingId: string) => void;
  addEvent: (event: GameEvent) => void;
  selectTile: (tileId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  tiles: {},
  buildings: {},
  recentEvents: [],
  selectedTileId: null,
  isLoading: false,
  error: null,
};

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setWorldState: (world) =>
      set((state) => ({
        tiles: world.tiles ?? state.tiles,
        buildings: world.buildings ?? state.buildings,
        recentEvents: world.recentEvents ?? state.recentEvents,
      })),

    upsertTile: (tile) =>
      set((state) => ({
        tiles: { ...state.tiles, [tile.id]: tile },
      })),

    upsertBuilding: (building) =>
      set((state) => ({
        buildings: { ...state.buildings, [building.id]: building },
      })),

    removeTile: (tileId) =>
      set((state) => {
        const tiles = { ...state.tiles };
        delete tiles[tileId];
        return { tiles };
      }),

    removeBuilding: (buildingId) =>
      set((state) => {
        const buildings = { ...state.buildings };
        delete buildings[buildingId];
        return { buildings };
      }),

    addEvent: (event) =>
      set((state) => ({
        // Keep max 50 events in memory
        recentEvents: [event, ...state.recentEvents].slice(0, 50),
      })),

    selectTile: (tileId) => set({ selectedTileId: tileId }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    reset: () => set(initialState),
  })),
);
