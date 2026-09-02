/**
 * BuildIran — Map TypeScript Types
 */

import type { LatLng } from './game.types';

// ─── Viewport ────────────────────────────────────────────────────────────────

export interface MapViewport {
  center: LatLng;
  zoom: number;
  bearing: number;
  pitch: number;
}

// ─── Map Marker ──────────────────────────────────────────────────────────────

export interface MapMarker {
  id: string;
  coordinate: LatLng;
  type: 'building' | 'player' | 'event' | 'poi';
  data?: Record<string, unknown>;
}

// ─── Map Region (react-native-maps style) ────────────────────────────────────

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// ─── Map Style ───────────────────────────────────────────────────────────────

export type MapStyleMode = 'dark' | 'light' | 'satellite';

// ─── Map Camera ──────────────────────────────────────────────────────────────

export interface MapCamera {
  centerCoordinate: [number, number]; // [lng, lat] — MapLibre order
  zoomLevel: number;
  animationDuration?: number;
}

// ─── Tile Grid ───────────────────────────────────────────────────────────────

export interface TileCoord {
  /** Map tile x index */
  x: number;
  /** Map tile y index */
  y: number;
  /** Zoom level */
  z: number;
}

// ─── Game Map Props ───────────────────────────────────────────────────────────

export interface GameMapProps {
  /** Initial viewport center */
  initialCenter?: LatLng;
  /** Initial zoom level */
  initialZoom?: number;
  /** Called when user taps/clicks a coordinate on the map */
  onMapPress?: (coordinate: LatLng) => void;
  /** Called when viewport changes */
  onRegionChange?: (viewport: MapViewport) => void;
  style?: object;
}
