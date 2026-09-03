/**
 * BuildIran — GameMap (Native: iOS + Android)
 * Uses MapLibre React Native with OpenFreeMap vector tiles (no API key).
 *
 * Runs in Custom Dev Client or Prebuild (EAS Build / local native build).
 */

import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, NativeSyntheticEvent, Text } from 'react-native';
import type {
  CameraRef,
  ViewStateChangeEvent,
  PressEvent,
  PressEventWithFeatures,
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

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');

function loadMapLibre(): MapLibreModule | null {
  try {
    // MapLibre is unavailable in Expo Go, so load it only when the native binary provides it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@maplibre/maplibre-react-native') as MapLibreModule;
  } catch {
    return null;
  }
}

export const GameMap: React.FC<GameMapProps> = ({
  initialCenter = MAP_DEFAULT_CENTER,
  initialZoom = MAP_DEFAULT_ZOOM,
  onMapPress,
  onRegionChange,
  style,
}) => {
  const cameraRef = useRef<CameraRef>(null);
  const mapLibre = loadMapLibre();

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

  if (!mapLibre) {
    return (
      <View style={[styles.container, styles.unavailable, style]}>
        <Text style={styles.unavailableText}>
          نقشه در نسخه آزمایشی موبایل در دسترس نیست. برای استفاده از نقشه، یک Development Build بسازید.
        </Text>
      </View>
    );
  }

  const MapView = mapLibre.Map;
  const CameraView = mapLibre.Camera;

  return (
    <View style={[styles.container, style]}>
      <MapView
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
        <CameraView
          ref={cameraRef}
          initialViewState={{
            center: [initialCenter.longitude, initialCenter.latitude],
            zoom: initialZoom,
          }}
          minZoom={MAP_MIN_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
        />
      </MapView>
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
  unavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  unavailableText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default GameMap;
