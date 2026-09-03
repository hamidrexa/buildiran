/**
 * BuildIran — GameMap (Native: iOS + Android)
 * Uses MapLibre React Native with OpenFreeMap vector tiles (no API key).
 *
 * Runs in Custom Dev Client or Prebuild (EAS Build / local native build).
 *
 * NOTE: This module is intentionally only required from the shared
 * `GameMap.tsx` wrapper, which guards against loading it inside Expo Go
 * (where `MLRNCameraModule` is not registered).
 */

import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, NativeSyntheticEvent } from 'react-native';
import {
  Map,
  Camera,
  type CameraRef,
  type ViewStateChangeEvent,
  type PressEvent,
  type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native';
import type { GameMapProps } from '@/types/map.types';
import type { LatLng } from '@/types/game.types';
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
  const cameraRef = useRef<CameraRef>(null);

  const handlePress = useCallback(
    (event: NativeSyntheticEvent<PressEvent> | NativeSyntheticEvent<PressEventWithFeatures>) => {
      if (!onMapPress) return;
      const [longitude, latitude] = event.nativeEvent.lngLat;
      onMapPress({ latitude, longitude });
    },
    [onMapPress],
  );

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      if (!onRegionChange) return;
      const { center: [longitude, latitude], zoom, bearing, pitch } = event.nativeEvent;
      const center: LatLng = { latitude, longitude };
      onRegionChange({ center, zoom, bearing, pitch });
    },
    [onRegionChange],
  );

  return (
    <View style={[styles.container, style]}>
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        onPress={handlePress}
        onRegionDidChange={handleRegionDidChange}
        compass
        dragPan
        touchZoom
        touchRotate
        touchPitch
        attribution
        logo={false}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [initialCenter.longitude, initialCenter.latitude],
            zoom: initialZoom,
          }}
          minZoom={MAP_MIN_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
        />
      </Map>
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
