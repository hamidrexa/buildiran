import { setWorkerUrl as maplibreSetWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  ScaleControl,
  Source,
  type MapMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import { StyleSheet } from "react-native";

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
import type { GameMapProps } from "@/types/map.types";
import { createGeoJSONCircle } from "@/utils/geo";
import tehranDistrictsRaw from "../../../assets/maps/Tehran Districts.json";
import { useMapStore } from "@/store/useMapStore";

// Metro cannot resolve maplibre's `new URL(..., import.meta.url)` worker, so the
// GeoJSON/vector worker silently never starts (raster tiles still render, which
// masks it). Serve the worker + its shared chunk from /public instead.
maplibreSetWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

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
  onPressNCC,
  buildingZone,
  flyToTarget,
  showDistricts = true,
  style,
}) => {
  const mapRef = useRef<MapRef>(null);
  const showDistrictsOverlay = useMapStore((s) => s.showDistrictsOverlay);
  const showOtherPlayersAssets = useMapStore((s) => s.showOtherPlayersAssets);

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
    return createGeoJSONCircle(
      buildingZone.center,
      buildingZone.radiusMeters,
      64,
    );
  }, [buildingZone]);

  const zoneColor = useMemo(() => {
    if (!buildingZone) return "#6C63FF";
    if (buildingZone.status === "valid") return "#10B981";
    if (buildingZone.status === "invalid") return "#EF4444";
    return "#F59E0B";
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
      const labelMedium = isLocked ? `🔒 ${name}` : name;
      const labelClose = isLocked
        ? `🔒 ${name}\nمحله قفل است`
        : `${name}\n(محله فعال)`;

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
        mapStyle={mapStyle as any}
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
        <NavigationControl position="bottom-left" />
        <ScaleControl position="bottom-left" unit="metric" />

        {/* Tehran Districts Border Layer (toggleable) */}
        {showDistricts && showDistrictsOverlay && (
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
            <Layer
              id="tehran-districts-line"
              type="line"
              paint={{
                "line-color": [
                  "case",
                  ["==", ["get", "isLocked"], true],
                  DISTRICT_MAP_CONFIG.COLOR_LOCKED_BORDER,
                  DISTRICT_MAP_CONFIG.COLOR_ACTIVE_BORDER,
                ],
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
                  9,
                  0.7,
                  10,
                  0.9,
                  15,
                  0.85,
                ],
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
                "text-color": DISTRICT_MAP_CONFIG.LABEL_COLOR,
                "text-halo-color": DISTRICT_MAP_CONFIG.LABEL_HALO_COLOR,
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
        {showDistricts && showDistrictsOverlay &&
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
                        background: "rgba(16, 185, 129, 0.9)",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "10px",
                        fontWeight: 600,
                        border: "1.5px solid #10B981",
                        boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
                        whiteSpace: "nowrap",
                        marginBottom: "4px",
                        direction: "rtl",
                      }}
                    >
                      🏛️ مرکز محله
                    </div>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: "#10B981",
                        border: "2px solid #fff",
                        boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)",
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
                  background: "rgba(8, 12, 26, 0.9)",
                  color: "#fff",
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
                    ? "✅"
                    : buildingZone.status === "invalid"
                      ? "🚫"
                      : "⏳"}
                </span>
                <span>شعاع ۵ متر</span>
              </div>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: zoneColor,
                  border: "2px solid #fff",
                  boxShadow: `0 0 8px ${zoneColor}`,
                }}
              />
            </div>
          </Marker>
        )}

        {/* On-Map Built Assets */}
        {assets.map((asset) => {
          const isOwned = currentUserId
            ? asset.ownerId === currentUserId
            : false;

          if (!showOtherPlayersAssets && !isOwned) {
            return null; // hide other players' assets if toggled off
          }

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
