/**
 * BuildIran — GameMap (Web)
 * Uses react-map-gl (MapLibre) with OpenFreeMap vector tiles (no API key).
 *
 * Requires: npm install react-map-gl maplibre-gl
 */

import React, { useCallback } from 'react';
import Map, {
  NavigationControl,
  ScaleControl,
  type MapMouseEvent,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { GameMapProps } from '@/types/map.types';
import {
  MAP_STYLE_URL,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
} from '@/lib/constants';

export const GameMap: React.FC<GameMapProps> = ({
  initialCenter = MAP_DEFAULT_CENTER,
  initialZoom = MAP_DEFAULT_ZOOM,
  onMapPress,
  onRegionChange,
  style,
}) => {
  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      if (!onMapPress) return;
      const { lng: longitude, lat: latitude } = event.lngLat;
      onMapPress({ latitude, longitude });
    },
    [onMapPress],
  );

  const handleMove = useCallback(
    (event: ViewStateChangeEvent) => {
      if (!onRegionChange) return;
      const { longitude, latitude, zoom, bearing, pitch } = event.viewState;
      onRegionChange({
        center: { latitude, longitude },
        zoom,
        bearing,
        pitch,
      });
    },
    [onRegionChange],
  );

  return (
    <div style={{ flex: 1, width: '100%', height: '100%', ...style }}>
      <Map
        initialViewState={{
          longitude: initialCenter.longitude,
          latitude: initialCenter.latitude,
          zoom: initialZoom,
        }}
        mapStyle={MAP_STYLE_URL}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        onClick={handleClick}
        onMove={handleMove}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-left" />
        <ScaleControl position="bottom-left" unit="metric" />
      </Map>
    </div>
  );
};

export default GameMap;
