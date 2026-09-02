/**
 * BuildIran — GameMap (Native: iOS + Android)
 * Uses MapLibre React Native with OpenFreeMap vector tiles (no API key).
 *
 * Requires: npx expo install @maplibre/maplibre-react-native
 * This module requires a Custom Dev Build — cannot run in Expo Go.
 * Run: npx expo prebuild && npx expo run:ios / run:android
 */

import React, { useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import type { GameMapProps } from '@/types/map.types';
import type { LatLng } from '@/types/game.types';
import {
  MAP_STYLE_URL,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
} from '@/lib/constants';

// Suppress MapLibre telemetry opt-in dialog
MapLibreGL.setTelemetryEnabled(false);

export const GameMap: React.FC<GameMapProps> = ({
  initialCenter = MAP_DEFAULT_CENTER,
  initialZoom = MAP_DEFAULT_ZOOM,
  onMapPress,
  onRegionChange,
  style,
}) => {
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  const handlePress = useCallback(
    (feature: GeoJSON.Feature) => {
      if (!onMapPress) return;
      const [longitude, latitude] = (
        feature.geometry as GeoJSON.Point
      ).coordinates;
      onMapPress({ latitude, longitude });
    },
    [onMapPress],
  );

  const handleRegionDidChange = useCallback(
    async (feature: GeoJSON.Feature) => {
      if (!onRegionChange) return;
      const { zoomLevel, visibleBounds } = feature.properties as {
        zoomLevel: number;
        visibleBounds: number[][];
      };
      const centerLon =
        (visibleBounds[0][0] + visibleBounds[1][0]) / 2;
      const centerLat =
        (visibleBounds[0][1] + visibleBounds[1][1]) / 2;
      const center: LatLng = { latitude: centerLat, longitude: centerLon };
      onRegionChange({ center, zoom: zoomLevel, bearing: 0, pitch: 0 });
    },
    [onRegionChange],
  );

  return (
    <View style={[styles.container, style]}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={MAP_STYLE_URL}
        onPress={handlePress}
        onRegionDidChange={handleRegionDidChange}
        compassEnabled
        rotateEnabled
        pitchEnabled
        attributionEnabled
        logoEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={initialZoom}
          centerCoordinate={[initialCenter.longitude, initialCenter.latitude]}
          minZoomLevel={MAP_MIN_ZOOM}
          maxZoomLevel={MAP_MAX_ZOOM}
          animationMode="flyTo"
          animationDuration={800}
        />
      </MapLibreGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default GameMap;
