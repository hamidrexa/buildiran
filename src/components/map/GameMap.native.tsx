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
  DISTRICT_MAP_CONFIG,
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
  showDistricts = true,
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
    const neighborhoodMap: Record<string, any> = {};
    if (neighborhoods && neighborhoods.length > 0) {
      neighborhoods.forEach((n) => {
        if (n.areaNumber) {
          neighborhoodMap[`${n.nameFa}_${n.areaNumber}`] = n;
        }
        if (!neighborhoodMap[n.nameFa]) {
          neighborhoodMap[n.nameFa] = n;
        }
      });
    }

    const features = tehranDistrictsRaw.features.map((f: any) => {
      const name = f.properties?.name || '';
      const areaNumber = f.properties?.area_number;
      const nb =
        neighborhoodMap[`${name}_${areaNumber}`] ||
        neighborhoodMap[name];

      // Rely strictly on Supabase neighborhoods table isLocked flag (default true if not yet found)
      const isLocked = nb ? (nb.isLocked ?? true) : true;

      const labelFar = name;
      const labelMedium = isLocked ? `🔒 ${name}` : name;
      const labelClose = isLocked ? `🔒 ${name}\nمحله قفل است` : `${name}\n(محله فعال)`;

      return {
        ...f,
        properties: {
          ...f.properties,
          isLocked,
          labelFar,
          labelMedium,
          labelClose,
        },
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
        {showDistricts && (
          <GeoJSONSource id="tehran-districts-source" data={districtsGeoJSON as any}>
            <Layer
              id="tehran-districts-fill"
              type="fill"
              style={{
                fillColor: [
                  'case',
                  ['==', ['get', 'isLocked'], true],
                  DISTRICT_MAP_CONFIG.COLOR_LOCKED,
                  DISTRICT_MAP_CONFIG.COLOR_ACTIVE,
                ],
                fillOpacity: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  DISTRICT_MAP_CONFIG.ZOOM_FAR,
                  DISTRICT_MAP_CONFIG.OPACITY_FAR, // 10 -> 0.20
                  DISTRICT_MAP_CONFIG.ZOOM_MEDIUM,
                  DISTRICT_MAP_CONFIG.OPACITY_MEDIUM, // 11.5 -> 0.10
                  DISTRICT_MAP_CONFIG.ZOOM_CLOSE,
                  DISTRICT_MAP_CONFIG.OPACITY_CLOSE, // 13 -> 0.04
                  DISTRICT_MAP_CONFIG.ZOOM_STREET,
                  DISTRICT_MAP_CONFIG.OPACITY_STREET, // 14 -> 0.0
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
                  DISTRICT_MAP_CONFIG.COLOR_LOCKED_BORDER,
                  DISTRICT_MAP_CONFIG.COLOR_ACTIVE_BORDER,
                ],
                lineWidth: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  DISTRICT_MAP_CONFIG.ZOOM_FAR,
                  DISTRICT_MAP_CONFIG.BORDER_WIDTH_FAR,
                  DISTRICT_MAP_CONFIG.ZOOM_MEDIUM,
                  DISTRICT_MAP_CONFIG.BORDER_WIDTH_MEDIUM,
                  DISTRICT_MAP_CONFIG.ZOOM_STREET,
                  DISTRICT_MAP_CONFIG.BORDER_WIDTH_STREET,
                ],
                lineOpacity: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9, 0.7,
                  10, 0.9,
                  15, 0.85,
                ],
              } as any}
            />
            <Layer
              id="tehran-districts-symbol"
              type="symbol"
              style={{
                textField: [
                  'step',
                  ['zoom'],
                  ['get', 'labelFar'],
                  DISTRICT_MAP_CONFIG.ZOOM_MEDIUM,
                  ['get', 'labelMedium'],
                  DISTRICT_MAP_CONFIG.ZOOM_CLOSE,
                  ['get', 'labelClose'],
                ],
                textColor: DISTRICT_MAP_CONFIG.LABEL_COLOR,
                textSize: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9, DISTRICT_MAP_CONFIG.LABEL_SIZE_FAR,
                  11.5, DISTRICT_MAP_CONFIG.LABEL_SIZE_MEDIUM,
                  13, DISTRICT_MAP_CONFIG.LABEL_SIZE_CLOSE,
                ],
                textHaloColor: DISTRICT_MAP_CONFIG.LABEL_HALO_COLOR,
                textHaloWidth: DISTRICT_MAP_CONFIG.LABEL_HALO_WIDTH,
                textOpacity: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9, 0.6,
                  10, 1.0,
                  13.2, 0.9,
                  DISTRICT_MAP_CONFIG.LABEL_FADE_ZOOM, 0.0,
                ],
              } as any}
            />
          </GeoJSONSource>
        )}

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
