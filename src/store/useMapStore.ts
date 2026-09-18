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
  flyToTarget: { center: LatLng; zoom: number; duration?: number } | null;

  // ─── Visual Settings ───────────────────────────────────────────────────────
  showDistrictsOverlay: boolean;
  showOtherPlayersAssets: boolean;

  // ─── Actions ───────────────────────────────────────────────────────────────
  setViewport: (viewport: Partial<MapViewport>) => void;
  setPressedCoordinate: (coord: LatLng | null) => void;
  flyTo: (center: LatLng, zoom?: number) => void;
  triggerFlyTo: (target: { center: LatLng; zoom: number; duration?: number } | null) => void;
  setFollowUser: (follow: boolean) => void;
  setShowDistrictsOverlay: (show: boolean) => void;
  setShowOtherPlayersAssets: (show: boolean) => void;
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
  flyToTarget: null,
  showDistrictsOverlay: true,
  showOtherPlayersAssets: true,

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

  triggerFlyTo: (flyToTarget) => set({ flyToTarget }),

  setFollowUser: (isFollowingUser) => set({ isFollowingUser }),

  setShowDistrictsOverlay: (showDistrictsOverlay) => set({ showDistrictsOverlay }),
  
  setShowOtherPlayersAssets: (showOtherPlayersAssets) => set({ showOtherPlayersAssets }),

  resetViewport: () => set({ viewport: defaultViewport }),
}));
