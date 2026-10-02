import { setWorkerUrl as maplibreSetWorkerUrl, setRTLTextPlugin } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Layer,
  Marker,
  Source,
  type MapMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Pressable } from "react-native";

import { BuildingMarker, getBuildingStyle } from "@/components/game/BuildingMarker";
import {
  DISTRICT_MAP_CONFIG,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_STYLE,
  TEHRAN_BOUNDS,
} from "@/lib/constants";
import { useMapStore } from "@/store/useMapStore";
import type { GameMapProps } from "@/types/map.types";
import { useTheme } from "@/theme/ThemeProvider";
import { createGeoJSONCircle } from "@/utils/geo";
import tehranDistrictsRaw from "../../../assets/maps/Tehran Districts.json";

// Metro cannot resolve maplibre's `new URL(..., import.meta.url)` worker, so the
// GeoJSON/vector worker silently never starts (raster tiles still render, which
// masks it). Serve the worker + its shared chunk from /public instead.
maplibreSetWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// Persian/Arabic label shaping. Without this plugin maplibre renders RTL text
// disconnected and letter-reversed (e.g. «خاتمی» as «یم‌ت‌اخ»).
// Vendored locally (public/maplibre) so shaping never depends on a CDN.
// Client-only: the SSR static renderer must never touch DOM APIs here.
if (typeof document !== "undefined") {
  try {
    setRTLTextPlugin("/maplibre/maplibre-gl-rtl-text.min.js", true);
  } catch (error) {
    console.warn("[GameMap] RTL text plugin could not be registered:", error);
  }
}

// ─── Aggregation (zoom-out clusters) ─────────────────────────────────────────
// Below this zoom, individual building markers get crowded; assets aggregate
// per (type × neighborhood) into one counted icon, e.g. «خانه ×۵».

const AGGREGATE_ZOOM = 14;

type Cluster = {
  key: string;
  type: string;
  district: string;
  count: number;
  longitude: number;
  latitude: number;
};

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** District (neighborhood) name containing the point, or null for free map. */
function districtNameAt(
  lng: number,
  lat: number,
  features: any[],
): string | null {
  for (const f of features) {
    const g = f?.geometry;
    if (!g) continue;
    if (g.type === "Polygon") {
      if (pointInRing(lng, lat, g.coordinates[0])) return f.properties?.name ?? null;
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates) {
        if (pointInRing(lng, lat, poly[0])) return f.properties?.name ?? null;
      }
    }
  }
  return null;
}

export const GameMap: React.FC<GameMapProps> = ({
  initialCenter = MAP_DEFAULT_CENTER,
  initialZoom = MAP_DEFAULT_ZOOM,
  mapStyle,
  onMapPress,
  onRegionChange,
  assets = [],
  neighborhoods = [],
  currentUserId,
  selectedAssetId,
  onAssetPress,
  onPressNCC,
  buildingZone,
  flyToTarget,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Basemap follows the active palette unless the caller overrides it.
  const resolvedStyle = mapStyle ?? colors.mapStyle ?? MAP_STYLE;
  const mapRef = useRef<MapRef>(null);
  const showDistrictsOverlay = useMapStore((s) => s.showDistrictsOverlay);
  const showOtherPlayersAssets = useMapStore((s) => s.showOtherPlayersAssets);

  // Live camera state (drives aggregation + neon hero district)
  const [zoom, setZoom] = useState(initialZoom);
  const [center, setCenter] = useState(initialCenter);
  const aggregated = zoom < AGGREGATE_ZOOM;

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
      const { longitude, latitude, zoom: z, bearing, pitch } = event.viewState;
      setZoom(z);
      setCenter({ latitude, longitude });
      if (!onRegionChange) return;
      onRegionChange({
        center: { latitude, longitude },
        zoom: z,
        bearing,
        pitch,
      });
    },
    [onRegionChange],
  );

  // GeoJSON 5-meter circle feature
  const circleGeoJSON = useMemo(() => {
    if (!buildingZone) return null;
    return createGeoJSONCircle(
      buildingZone.center,
      buildingZone.radiusMeters,
      64,
    );
  }, [buildingZone]);

  const zoneColor = useMemo(() => {
    if (!buildingZone) return colors.steel;
    if (buildingZone.status === "valid") return colors.jade;
    if (buildingZone.status === "invalid") return colors.crimson;
    return colors.steel;
  }, [buildingZone, colors]);

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
      const name = f.properties?.name || "";
      const areaNumber = f.properties?.area_number;
      const areaName = f.properties?.area_name || "";

      // Lookup matching neighborhood from DB
      const nb =
        neighborhoodMap[`${name}_${areaNumber}`] || neighborhoodMap[name];

      // Rely strictly on Supabase neighborhoods table isLocked flag (default true if not yet found)
      const isLocked = nb ? (nb.isLocked ?? true) : true;

      // Progressive zoom-dependent labels
      const labelFar = name;
      const labelMedium = isLocked ? `${name} · قفل` : name;
      const labelClose = isLocked
        ? `${name}\nمحله قفل است`
        : `${name}\nمحله فعال`;

      return {
        ...f,
        properties: {
          ...f.properties,
          isLocked,
          labelFar,
          labelMedium,
          labelClose,
          communityCenterLat: nb?.communityCenterLat,
          communityCenterLot: nb?.communityCenterLot,
          neighborhoodId: nb?.id,
        },
      };
    });

    return { ...tehranDistrictsRaw, features };
  }, [neighborhoods]);

  // The district under the camera — the neon hero overlay follows it.
  const activeDistrictName = useMemo(() => {
    if (!showDistrictsOverlay) return null;
    return districtNameAt(center.longitude, center.latitude, districtsGeoJSON.features);
  }, [center, districtsGeoJSON, showDistrictsOverlay]);

  // Visible assets (respect the other-players toggle)
  const visibleAssets = useMemo(
    () =>
      assets.filter(
        (a) =>
          showOtherPlayersAssets ||
          (currentUserId ? a.ownerId === currentUserId : false),
      ),
    [assets, showOtherPlayersAssets, currentUserId],
  );

  // Zoom-out aggregation: group per (building type × neighborhood)
  const clusters: Cluster[] = useMemo(() => {
    if (!aggregated || visibleAssets.length === 0) return [];
    const features = districtsGeoJSON.features;
    const groups: Record<
      string,
      { type: string; district: string; count: number; sumLat: number; sumLng: number }
    > = {};
    for (const asset of visibleAssets) {
      const district =
        districtNameAt(asset.longitude, asset.latitude, features) ?? "__free";
      const key = `${asset.type}|${district}`;
      const g = groups[key];
      if (g) {
        g.count += 1;
        g.sumLat += asset.latitude;
        g.sumLng += asset.longitude;
      } else {
        groups[key] = {
          type: asset.type,
          district,
          count: 1,
          sumLat: asset.latitude,
          sumLng: asset.longitude,
        };
      }
    }
    return Object.entries(groups).map(([key, g]) => ({
      key,
      type: g.type,
      district: g.district,
      count: g.count,
      longitude: g.sumLng / g.count,
      latitude: g.sumLat / g.count,
    }));
  }, [aggregated, visibleAssets, districtsGeoJSON]);

  const zoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 260 });
  }, []);
  const zoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 260 });
  }, []);

  const flatStyle = (
    style ? StyleSheet.flatten(style) : {}
  ) as React.CSSProperties;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
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
        mapStyle={resolvedStyle as any}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        maxBounds={[
          TEHRAN_BOUNDS.southWest.longitude,
          TEHRAN_BOUNDS.southWest.latitude,
          TEHRAN_BOUNDS.northEast.longitude,
          TEHRAN_BOUNDS.northEast.latitude,
        ]}
        onClick={handleClick}
        onMove={handleMove}
        onLoad={(e: any) => {
          const mapInstance = e?.target ?? mapRef.current;
          (window as any).__mapLoadFired = true;
          (window as any).__map = mapInstance;
        }}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        {/* Tehran Districts Border Layer (toggleable) */}
        {showDistrictsOverlay && (
          <Source
            id="tehran-districts-source"
            type="geojson"
            data={districtsGeoJSON as any}
          >
            <Layer
              id="tehran-districts-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "case",
                  ["==", ["get", "isLocked"], true],
                  DISTRICT_MAP_CONFIG.COLOR_LOCKED,
                  DISTRICT_MAP_CONFIG.COLOR_ACTIVE,
                ],
                "fill-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  DISTRICT_MAP_CONFIG.ZOOM_FAR,
                  DISTRICT_MAP_CONFIG.OPACITY_FAR,
                  DISTRICT_MAP_CONFIG.ZOOM_MEDIUM,
                  DISTRICT_MAP_CONFIG.OPACITY_MEDIUM,
                  DISTRICT_MAP_CONFIG.ZOOM_CLOSE,
                  DISTRICT_MAP_CONFIG.OPACITY_CLOSE,
                  DISTRICT_MAP_CONFIG.ZOOM_STREET,
                  DISTRICT_MAP_CONFIG.OPACITY_STREET,
                ],
              }}
            />
            {/* Neon hero — soft mint tint on the viewed district.
                Always mounted with a matching-nothing filter when inactive,
                so the layer identity never races with style loading. */}
            <Layer
              id="tehran-districts-hero-fill"
              type="fill"
              filter={["==", ["get", "name"], activeDistrictName ?? "__none__"]}
              paint={{
                "fill-color": colors.neon[400],
                "fill-opacity": isDark ? 0.08 : 0.1,
              }}
            />
            <Layer
              id="tehran-districts-line"
              type="line"
              paint={{
                "line-color": colors.border.strong,
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  DISTRICT_MAP_CONFIG.ZOOM_FAR,
                  DISTRICT_MAP_CONFIG.BORDER_WIDTH_FAR,
                  DISTRICT_MAP_CONFIG.ZOOM_MEDIUM,
                  DISTRICT_MAP_CONFIG.BORDER_WIDTH_MEDIUM,
                  DISTRICT_MAP_CONFIG.ZOOM_STREET,
                  DISTRICT_MAP_CONFIG.BORDER_WIDTH_STREET,
                ],
                "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  DISTRICT_MAP_CONFIG.ZOOM_FAR,
                  DISTRICT_MAP_CONFIG.BORDER_OPACITY_FAR,
                  DISTRICT_MAP_CONFIG.ZOOM_MEDIUM,
                  DISTRICT_MAP_CONFIG.BORDER_OPACITY_MEDIUM,
                  DISTRICT_MAP_CONFIG.ZOOM_STREET,
                  DISTRICT_MAP_CONFIG.BORDER_OPACITY_STREET,
                ],
              }}
            />
            {/* Neon hero — wide blurred glow under a thin electric core */}
            <Layer
              id="tehran-districts-hero-glow"
              type="line"
              filter={["==", ["get", "name"], activeDistrictName ?? "__none__"]}
              paint={{
                "line-color": colors.neon[400],
                "line-width": 9,
                "line-blur": 5,
                "line-opacity": isDark ? 0.4 : 0.32,
              }}
            />
            <Layer
              id="tehran-districts-hero-core"
              type="line"
              filter={["==", ["get", "name"], activeDistrictName ?? "__none__"]}
              paint={{
                "line-color": colors.neon[300],
                "line-width": 2.5,
                "line-opacity": 0.95,
              }}
            />
            <Layer
              id="tehran-districts-symbol"
              type="symbol"
              layout={{
                "text-field": [
                  "step",
                  ["zoom"],
                  ["get", "labelFar"],
                  DISTRICT_MAP_CONFIG.ZOOM_MEDIUM,
                  ["get", "labelMedium"],
                  DISTRICT_MAP_CONFIG.ZOOM_CLOSE,
                  ["get", "labelClose"],
                ],
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  DISTRICT_MAP_CONFIG.LABEL_SIZE_FAR,
                  11.5,
                  DISTRICT_MAP_CONFIG.LABEL_SIZE_MEDIUM,
                  13,
                  DISTRICT_MAP_CONFIG.LABEL_SIZE_CLOSE,
                ],
                "text-anchor": "center",
              }}
              paint={{
                "text-color": [
                  "case",
                  ["==", ["get", "name"], activeDistrictName ?? "__none__"],
                  colors.neon[300],
                  colors.text.primary,
                ],
                "text-halo-color": [
                  "case",
                  ["==", ["get", "name"], activeDistrictName ?? "__none__"],
                  isDark ? "rgba(6, 7, 9, 0.9)" : "rgba(255, 255, 255, 0.9)",
                  colors.bg.primary,
                ],
                "text-halo-width": DISTRICT_MAP_CONFIG.LABEL_HALO_WIDTH,
                "text-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  9,
                  0.6,
                  10,
                  1.0,
                  13.2,
                  0.9,
                  DISTRICT_MAP_CONFIG.LABEL_FADE_ZOOM,
                  0.0,
                ],
              }}
            />
          </Source>
        )}

        {/* Community Center Markers for Active Districts */}
        {showDistrictsOverlay &&
          districtsGeoJSON.features.map((feature: any) => {
            const props = feature.properties;
            if (
              !props.isLocked &&
              props.communityCenterLat &&
              props.communityCenterLot
            ) {
              return (
                <Marker
                  key={`community-center-${props.name}`}
                  longitude={props.communityCenterLot}
                  latitude={props.communityCenterLat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    if (props.neighborhoodId && onPressNCC) {
                      onPressNCC(props.neighborhoodId);
                    }
                  }}
                  style={{ cursor: "pointer", pointerEvents: "auto" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      pointerEvents: "auto",
                    }}
                  >
                    <div
                      style={{
                        background: colors.jade,
                        color: colors.text.inverse,
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "10px",
                        fontWeight: 600,
                        border: `1.5px solid ${colors.jade}`,
                        boxShadow: `0 0 8px ${colors.jade}80`,
                        whiteSpace: "nowrap",
                        marginBottom: "4px",
                        direction: "rtl",
                      }}
                    >
                      مرکز محله
                    </div>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: colors.jade,
                        border: `2px solid ${colors.text.primary}`,
                        boxShadow: `0 0 6px ${colors.jade}99`,
                      }}
                    />
                  </div>
                </Marker>
              );
            }
            return null;
          })}

        {/* 5-Meter Building Zone Overlay */}
        {circleGeoJSON && (
          <Source
            id="building-zone-source"
            type="geojson"
            data={circleGeoJSON as any}
          >
            <Layer
              id="building-zone-fill"
              type="fill"
              paint={{
                "fill-color": zoneColor,
                "fill-opacity": 0.32,
              }}
            />
            <Layer
              id="building-zone-stroke"
              type="line"
              paint={{
                "line-color": zoneColor,
                "line-width": 3,
                "line-dasharray":
                  buildingZone?.status === "invalid" ? [3, 2] : [1, 0],
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
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  background: isDark
                    ? "rgba(10, 12, 16, 0.88)"
                    : "rgba(255, 255, 255, 0.92)",
                  color: colors.text.primary,
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: `1.5px solid ${zoneColor}`,
                  boxShadow: `0 0 10px ${zoneColor}66`,
                  whiteSpace: "nowrap",
                  marginBottom: "4px",
                  direction: "rtl",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>
                  {buildingZone.status === "valid"
                    ? "✓"
                    : buildingZone.status === "invalid"
                      ? "✕"
                      : "…"}
                </span>
                <span>شعاع ۵ متر</span>
              </div>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: zoneColor,
                  border: `2px solid ${colors.text.primary}`,
                  boxShadow: `0 0 8px ${zoneColor}`,
                }}
              />
            </div>
          </Marker>
        )}

        {/* Zoomed-out aggregation: one counted icon per (type × neighborhood) */}
        {aggregated &&
          clusters.map((cluster) => (
            <Marker
              key={`cluster-${cluster.key}`}
              longitude={cluster.longitude}
              latitude={cluster.latitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                // Reveal the individual assets in this group
                mapRef.current?.flyTo({
                  center: [cluster.longitude, cluster.latitude],
                  zoom: AGGREGATE_ZOOM + 0.6,
                  duration: 700,
                  essential: true,
                });
              }}
              style={{ cursor: "zoom-in", pointerEvents: "auto" }}
            >
              <ClusterMarker cluster={cluster} />
            </Marker>
          ))}

        {/* On-Map Built Assets — individual markers once close enough */}
        {!aggregated &&
          visibleAssets.map((asset) => {
            const isOwned = currentUserId
              ? asset.ownerId === currentUserId
              : false;

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

      {/* Custom glass zoom controls — end side, clear of HUD rows and the dock */}
      <View style={styles.zoomPill} pointerEvents="box-none">
        <Pressable
          onPress={zoomIn}
          style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="بزرگ‌نمایی نقشه"
        >
          <Ionicons name="add" size={20} color={colors.text.primary} />
        </Pressable>
        <View style={styles.zoomDivider} />
        <Pressable
          onPress={zoomOut}
          style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="کوچک‌نمایی نقشه"
        >
          <Ionicons name="remove" size={20} color={colors.text.primary} />
        </Pressable>
      </View>
    </div>
  );
};

// ─── Aggregated cluster marker (glass plate + counted badge) ─────────────────

const ClusterMarker: React.FC<{ cluster: Cluster }> = ({ cluster }) => {
  const { colors } = useTheme();
  const { icon, tone } = getBuildingStyle(cluster.type);
  const toneColor =
    tone === "brass"
      ? colors.brass[400]
      : tone === "ember"
        ? colors.ember
        : tone === "jade"
          ? colors.jade
          : tone === "crimson"
            ? colors.crimson
            : colors.steel;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        borderRadius: "14px",
        background:
          colors.mode === "dark"
            ? "rgba(10, 12, 16, 0.9)"
            : "rgba(255, 255, 255, 0.95)",
        border: `1px solid ${colors.border.default}`,
        boxShadow: `0 4px 14px rgba(0,0,0,0.35), 0 0 12px ${toneColor}33`,
        direction: "rtl",
        cursor: "zoom-in",
      }}
    >
      <Ionicons name={icon} size={16} color={toneColor} />
      <span
        style={{
          minWidth: 18,
          height: 18,
          padding: "0 5px",
          borderRadius: 9,
          background: colors.brass[500],
          color: colors.text.inverse,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "VazirmatnBold",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {cluster.count.toLocaleString("fa-IR")}
      </span>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (c: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    zoomPill: {
      position: "absolute",
      end: 12,
      top: "42%",
      backgroundColor:
        c.mode === "dark" ? "rgba(10, 12, 16, 0.9)" : "rgba(255, 255, 255, 0.95)",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border.default,
      overflow: "hidden",
      zIndex: 5,
    },
    zoomBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    zoomBtnPressed: {
      backgroundColor: c.ink[500],
    },
    zoomDivider: {
      height: 1,
      backgroundColor: c.border.subtle,
    },
  });

export default GameMap;
