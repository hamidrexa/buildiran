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

import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_STYLE,
} from "@/lib/constants";
import type { LatLng } from "@/types/game.types";
import type { GameMapProps } from "@/types/map.types";
import { BuildingMarker } from "@/components/game/BuildingMarker";
import {
  Camera,
  Map,
  Marker,
  type CameraRef,
  type PressEvent,
  type PressEventWithFeatures,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import React, { useCallback, useRef } from "react";
import { NativeSyntheticEvent, StyleSheet, View } from "react-native";

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
  const cameraRef = useRef<CameraRef>(null);

  const handlePress = useCallback(
    (
      event:
        | NativeSyntheticEvent<PressEvent>
        | NativeSyntheticEvent<PressEventWithFeatures>,
    ) => {
      if (!onMapPress) return;
      const [longitude, latitude] = event.nativeEvent.lngLat;
      onMapPress({ latitude, longitude });
    },
    [onMapPress],
  );

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      if (!onRegionChange) return;
      const {
        center: [longitude, latitude],
        zoom,
        bearing,
        pitch,
      } = event.nativeEvent;
      const center: LatLng = { latitude, longitude };
      onRegionChange({ center, zoom, bearing, pitch });
    },
    [onRegionChange],
  );

  return (
    <View style={[styles.container, style]}>
      <Map
        style={styles.map}
        mapStyle={mapStyle as any}
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

        {/* On-Map Built Assets */}
        {assets.map((asset) => {
          const isOwned = currentUserId ? asset.ownerId === currentUserId : false;
          const isSelected = selectedAssetId === asset.id;

          return (
            <Marker
              key={asset.id}
              id={asset.id}
              lngLat={[asset.longitude, asset.latitude]}
              anchor="bottom"
              selected={isSelected}
              onPress={() => onAssetPress?.(asset)}
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
