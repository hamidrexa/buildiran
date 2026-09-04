import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Map, {
  Marker,
  NavigationControl,
  ScaleControl,
  type MapMouseEvent,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { GameMapProps } from '@/types/map.types';
import { BuildingMarker } from '@/components/game/BuildingMarker';
import {
  MAP_STYLE,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
} from '@/lib/constants';

export const GameMap: React.FC<GameMapProps> = ({
  initialCenter = MAP_DEFAULT_CENTER,
  initialZoom = MAP_DEFAULT_ZOOM,
  mapStyle = MAP_STYLE,
  onMapPress,
  onRegionChange,
  assets = [],
  currentUserId,
  selectedAssetId,
  onAssetPress,
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

  const flatStyle = (style ? StyleSheet.flatten(style) : {}) as React.CSSProperties;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        ...flatStyle,
      }}
    >
      <Map
        initialViewState={{
          longitude: initialCenter.longitude,
          latitude: initialCenter.latitude,
          zoom: initialZoom,
        }}
        mapStyle={mapStyle as any}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        onClick={handleClick}
        onMove={handleMove}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-left" />
        <ScaleControl position="bottom-left" unit="metric" />

        {/* On-Map Built Assets */}
        {assets.map((asset) => {
          const isOwned = currentUserId ? asset.ownerId === currentUserId : false;
          const isSelected = selectedAssetId === asset.id;

          return (
            <Marker
              key={asset.id}
              longitude={asset.longitude}
              latitude={asset.latitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onAssetPress?.(asset);
              }}
            >
              <BuildingMarker
                asset={asset}
                isOwned={isOwned}
                isSelected={isSelected}
              />
            </Marker>
          );
        })}
      </Map>
    </div>
  );
};

export default GameMap;
