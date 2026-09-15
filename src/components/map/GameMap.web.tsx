import "maplibre-gl/dist/maplibre-gl.css";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

  // Toggle for the Tehran districts border layer
  const [showDistricts, setShowDistricts] = useState(true);

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
        <NavigationControl position="top-left" />
        <ScaleControl position="bottom-left" unit="metric" />

        {/* Tehran Districts Border Layer (toggleable) */}
        {showDistricts && (
          <Source
            id="tehran-districts-source"
            type="geojson"
            data={districtsGeoJSON as any}
          >
            <Layer
              id="tehran-districts-fill"
              type="fill"
              paint={{
                "fill-color": "#0EA5E9",
                "fill-opacity": 0.15,
              }}
            />
            <Layer
              id="tehran-districts-line"
              type="line"
              paint={{
                "line-color": "#0EA5E9",
                "line-width": 2.5,
                "line-opacity": 0.9,
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

      {/* District borders layer toggle — bottom-left of the page */}
      <button
        type="button"
        onClick={() => setShowDistricts((v) => !v)}
        style={{
          position: "absolute",
          left: 10,
          bottom: 40,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          borderRadius: 10,
          border: `1.5px solid ${showDistricts ? "#0EA5E9" : "rgba(255,255,255,0.25)"}`,
          background: "rgba(8, 12, 26, 0.85)",
          color: showDistricts ? "#0EA5E9" : "rgba(255,255,255,0.6)",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          direction: "rtl",
          boxShadow: showDistricts ? "0 0 10px rgba(14,165,233,0.4)" : "none",
        }}
        title={showDistricts ? "پنهان کردن محدوده مناطق" : "نمایش محدوده مناطق"}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            background: showDistricts ? "#0EA5E9" : "rgba(255,255,255,0.3)",
            border: showDistricts ? "none" : "1px solid rgba(255,255,255,0.4)",
          }}
        />
        مناطق تهران
      </button>
    </div>
  );
};

export default GameMap;
