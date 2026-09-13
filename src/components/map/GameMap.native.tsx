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

import { BuildingMarker } from "@/components/game/BuildingMarker";
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_STYLE,
  TEHRAN_BOUNDS,
} from "@/lib/constants";
import type { LatLng } from "@/types/game.types";
import type { GameMapProps } from "@/types/map.types";
import { createGeoJSONCircle } from "@/utils/geo";
import tehranDistrictsRaw from "../../../assets/maps/Tehran Districts.json";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type CameraRef,
  type PressEvent,
  type PressEventWithFeatures,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { NativeSyntheticEvent, StyleSheet, Text, View } from "react-native";

export const GameMap: React.FC<GameMapProps> = ({
  initialCenter = MAP_DEFAULT_CENTER,
  initialZoom = MAP_DEFAULT_ZOOM,
  mapStyle = MAP_STYLE,
  onMapPress,
  onRegionChange,
  assets = [],
  neighborhoods = [],
  currentUserId,
  selectedAssetId,
  onAssetPress,
  buildingZone,
  flyToTarget,
  style,
}) => {
  const cameraRef = useRef<CameraRef>(null);

  // Imperative fly-to camera control
  useEffect(() => {
    if (flyToTarget && cameraRef.current) {
      cameraRef.current.flyTo({
        center: [flyToTarget.center.longitude, flyToTarget.center.latitude],
        zoom: flyToTarget.zoom,
        duration: flyToTarget.duration ?? 900,
      });
    }
  }, [flyToTarget]);

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

  // GeoJSON 5-meter circle
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

  const districtsGeoJSON = useMemo(() => {
    if (!neighborhoods || neighborhoods.length === 0) {
      return tehranDistrictsRaw;
    }
    const features = tehranDistrictsRaw.features.map((f: any) => {
      const name = f.properties.name;
      const neighborhood = neighborhoods.find(n => n.nameFa === name);
      return {
        ...f,
        properties: {
          ...f.properties,
          isLocked: neighborhood?.isLocked ?? true
        }
      };
    });
    return { ...tehranDistrictsRaw, features };
  }, [neighborhoods]);

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
          maxBounds={[
            TEHRAN_BOUNDS.southWest.longitude,
            TEHRAN_BOUNDS.southWest.latitude,
            TEHRAN_BOUNDS.northEast.longitude,
            TEHRAN_BOUNDS.northEast.latitude,
          ]}
        />

        {/* Tehran Districts Overlay */}
        <GeoJSONSource id="tehran-districts-source" data={districtsGeoJSON as any}>
          <Layer
            id="tehran-districts-fill"
            type="fill"
            style={{
              fillColor: [
                'case',
                ['==', ['get', 'isLocked'], true],
                'rgba(120, 120, 120, 0.8)', // Locked color
                'rgba(108, 99, 255, 0.4)'   // Unlocked color (primary brand)
              ],
              fillOpacity: [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0.6,
                14, 0.0
              ],
            } as any}
          />
          <Layer
            id="tehran-districts-line"
            type="line"
            style={{
              lineColor: [
                'case',
                ['==', ['get', 'isLocked'], true],
                'rgba(150, 150, 150, 0.8)',
                'rgba(108, 99, 255, 0.8)'
              ],
              lineWidth: 2,
            } as any}
          />
          <Layer
            id="tehran-districts-symbol"
            type="symbol"
            style={{
              textField: '{name}\n{area_name}',
              textColor: '#FFFFFF',
              textSize: 12,
              textHaloColor: 'rgba(0, 0, 0, 0.8)',
              textHaloWidth: 1,
              textOpacity: [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 1.0,
                13, 0.0
              ],
            } as any}
          />
        </GeoJSONSource>

        {/* 5-Meter Building Zone Overlay */}
        {circleGeoJSON && (
          <GeoJSONSource id="building-zone-source" data={circleGeoJSON as any}>
            <Layer
              id="building-zone-fill"
              type="fill"
              style={{
                fillColor: zoneColor,
                fillOpacity: 0.32,
              } as any}
            />
            <Layer
              id="building-zone-line"
              type="line"
              style={{
                lineColor: zoneColor,
                lineWidth: 3,
              } as any}
            />
          </GeoJSONSource>
        )}

        {/* Center Target Marker for Building Zone */}
        {buildingZone && (
          <Marker
            id="building-zone-marker"
            lngLat={[buildingZone.center.longitude, buildingZone.center.latitude]}
            anchor="center"
          >
            <View style={styles.zoneMarkerContainer}>
              <View style={[styles.zoneBadge, { borderColor: zoneColor }]}>
                <Text style={styles.zoneBadgeText}>
                  {buildingZone.status === 'valid' ? '✅' : buildingZone.status === 'invalid' ? '🚫' : '⏳'} شعاع ۵ متر
                </Text>
              </View>
              <View style={[styles.zoneCenterDot, { backgroundColor: zoneColor }]} />
            </View>
          </Marker>
        )}

        {/* On-Map Built Assets */}
        {assets.map((asset) => {
          const isOwned = currentUserId
            ? asset.ownerId === currentUserId
            : false;
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
  zoneMarkerContainer: {
    alignItems: 'center',
  },
  zoneBadge: {
    backgroundColor: 'rgba(8, 12, 26, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  zoneBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  zoneCenterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default GameMap;
