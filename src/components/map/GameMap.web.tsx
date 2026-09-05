import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Map, {
  Layer,
  Marker,
  NavigationControl,
  ScaleControl,
  Source,
  type MapMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { GameMapProps } from '@/types/map.types';
import { BuildingMarker } from '@/components/game/BuildingMarker';
import { createGeoJSONCircle } from '@/utils/geo';
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
  buildingZone,
  flyToTarget,
  style,
}) => {
  const mapRef = useRef<MapRef>(null);

  // Imperative fly-to camera control
  useEffect(() => {
    if (flyToTarget && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyToTarget.center.longitude, flyToTarget.center.latitude],
        zoom: flyToTarget.zoom,
        duration: flyToTarget.duration ?? 900,
        essential: true,
      });
    }
  }, [flyToTarget]);

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

  // GeoJSON 5-meter circle feature
  const circleGeoJSON = useMemo(() => {
    if (!buildingZone) return null;
    return createGeoJSONCircle(buildingZone.center, buildingZone.radiusMeters, 64);
  }, [buildingZone]);

  const zoneColor = useMemo(() => {
    if (!buildingZone) return '#6C63FF';
    if (buildingZone.status === 'valid') return '#10B981';
    if (buildingZone.status === 'invalid') return '#EF4444';
    return '#F59E0B';
  }, [buildingZone]);

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
        ref={mapRef}
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

        {/* 5-Meter Building Zone Overlay */}
        {circleGeoJSON && (
          <Source id="building-zone-source" type="geojson" data={circleGeoJSON as any}>
            <Layer
              id="building-zone-fill"
              type="fill"
              paint={{
                'fill-color': zoneColor,
                'fill-opacity': 0.32,
              }}
            />
            <Layer
              id="building-zone-stroke"
              type="line"
              paint={{
                'line-color': zoneColor,
                'line-width': 3,
                'line-dasharray': buildingZone?.status === 'invalid' ? [3, 2] : [1, 0],
              }}
            />
          </Source>
        )}

        {/* Center Target Marker for Building Zone */}
        {buildingZone && (
          <Marker
            longitude={buildingZone.center.longitude}
            latitude={buildingZone.center.latitude}
            anchor="center"
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  background: 'rgba(8, 12, 26, 0.9)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: `1.5px solid ${zoneColor}`,
                  boxShadow: `0 0 10px ${zoneColor}66`,
                  whiteSpace: 'nowrap',
                  marginBottom: '4px',
                  direction: 'rtl',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{buildingZone.status === 'valid' ? '✅' : buildingZone.status === 'invalid' ? '🚫' : '⏳'}</span>
                <span>شعاع ۵ متر</span>
              </div>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: zoneColor,
                  border: '2px solid #fff',
                  boxShadow: `0 0 8px ${zoneColor}`,
                }}
              />
            </div>
          </Marker>
        )}

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
