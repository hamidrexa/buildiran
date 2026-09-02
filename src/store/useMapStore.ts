/**
 * BuildIran — Zustand Map Store
 * Viewport position, zoom level, selected coordinate.
 */

import { create } from 'zustand';
import type { MapViewport } from '@/types/map.types';
import type { LatLng } from '@/types/game.types';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/constants';

interface MapState {
  // ─── Viewport ──────────────────────────────────────────────────────────────
  viewport: MapViewport;
  pressedCoordinate: LatLng | null;
  isFollowingUser: boolean;

  // ─── Actions ───────────────────────────────────────────────────────────────
  setViewport: (viewport: Partial<MapViewport>) => void;
  setPressedCoordinate: (coord: LatLng | null) => void;
  flyTo: (center: LatLng, zoom?: number) => void;
  setFollowUser: (follow: boolean) => void;
  resetViewport: () => void;
}

const defaultViewport: MapViewport = {
  center: MAP_DEFAULT_CENTER,
  zoom: MAP_DEFAULT_ZOOM,
  bearing: 0,
  pitch: 0,
};

export const useMapStore = create<MapState>()((set) => ({
  viewport: defaultViewport,
  pressedCoordinate: null,
  isFollowingUser: false,

  setViewport: (partial) =>
    set((state) => ({
      viewport: { ...state.viewport, ...partial },
    })),

  setPressedCoordinate: (pressedCoordinate) => set({ pressedCoordinate }),

  flyTo: (center, zoom) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        center,
        zoom: zoom ?? state.viewport.zoom,
      },
      isFollowingUser: false,
    })),

  setFollowUser: (isFollowingUser) => set({ isFollowingUser }),

  resetViewport: () => set({ viewport: defaultViewport }),
}));
