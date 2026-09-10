/**
 * BuildIran — Geographic Utilities
 */

import type { Bounds, LatLng } from '@/types/game.types';

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula — great-circle distance between two points in kilometers.
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) *
    Math.cos(toRad(b.latitude)) *
    sinDLon *
    sinDLon;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Converts meters to degrees of latitude (approximate).
 */
export function metersToLatDelta(meters: number): number {
  return meters / 111320;
}

/**
 * Converts meters to degrees of longitude at a given latitude.
 */
export function metersToLonDelta(meters: number, latitude: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  return meters / (111320 * Math.cos(toRad(latitude)));
}

/**
 * Generates a square bounding box (polygon) around a center point
 * with a given side length in meters.
 */
export function squareBoundsAround(
  center: LatLng,
  sideLengthMeters: number,
): LatLng[] {
  const half = sideLengthMeters / 2;
  const latDelta = metersToLatDelta(half);
  const lonDelta = metersToLonDelta(half, center.latitude);

  return [
    { latitude: center.latitude + latDelta, longitude: center.longitude - lonDelta },
    { latitude: center.latitude + latDelta, longitude: center.longitude + lonDelta },
    { latitude: center.latitude - latDelta, longitude: center.longitude + lonDelta },
    { latitude: center.latitude - latDelta, longitude: center.longitude - lonDelta },
  ];
}

/**
 * Checks if a coordinate is inside a bounding box.
 */
export function isWithinBounds(point: LatLng, bounds: Bounds): boolean {
  return (
    point.latitude >= bounds.southWest.latitude &&
    point.latitude <= bounds.northEast.latitude &&
    point.longitude >= bounds.southWest.longitude &&
    point.longitude <= bounds.northEast.longitude
  );
}

/**
 * Returns the centroid (average center) of a list of coordinates.
 */
export function centroid(points: LatLng[]): LatLng {
  if (points.length === 0) return { latitude: 0, longitude: 0 };
  const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
  const lon = points.reduce((s, p) => s + p.longitude, 0) / points.length;
  return { latitude: lat, longitude: lon };
}

/**
 * Formats a LatLng as a human-readable coordinate string.
 */
export function formatCoordinate(coord: LatLng, precision = 4): string {
  return `${coord.latitude.toFixed(precision)}°N, ${coord.longitude.toFixed(precision)}°E`;
}

/**
 * Generates a stable tile ID from map coordinates.
 * Tiles are 0.005° × 0.005° cells (≈500m at equator).
 */
export function tileIdFromCoordinate(coord: LatLng, precision = 3): string {
  const lat = Math.floor(coord.latitude / 0.005) * 0.005;
  const lon = Math.floor(coord.longitude / 0.005) * 0.005;
  return `tile_${lat.toFixed(precision)}_${lon.toFixed(precision)}`;
}

// ─── 5-Meter Building Zone & Street Distance Validation ──────────────────────

export interface StreetProximityResult {
  isValid: boolean;              // true if distance > ruleDistanceMeters (not on street)
  distanceMeters: number;        // calculated distance to nearest street in meters
  nearestStreetName: string;     // name or type of nearest street
  ruleDistanceMeters: number;    // default 5m
  message: string;               // human-readable status in Persian
}

/**
 * Generates a GeoJSON Polygon representing a circular zone with a specified radius in meters.
 */
export function createGeoJSONCircle(
  center: LatLng,
  radiusMeters: number,
  points = 64,
): {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  properties: Record<string, unknown>;
} {
  const coords: [number, number][] = [];
  const distanceX = radiusMeters / (111320 * Math.cos((center.latitude * Math.PI) / 180));
  const distanceY = radiusMeters / 110540;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center.longitude + x, center.latitude + y]);
  }
  coords.push(coords[0]); // close polygon

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties: {
      radiusMeters,
      centerLat: center.latitude,
      centerLng: center.longitude,
    },
  };
}

/**
 * Calculates the shortest distance in meters from a point P to a line segment AB.
 */
export function pointToSegmentDistanceMeters(
  p: { lat: number; lon: number },
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const latMid = (p.lat + a.lat + b.lat) / 3;
  const metersPerDegLat = 111139;
  const metersPerDegLon = 111139 * Math.cos((latMid * Math.PI) / 180);

  const px = p.lon * metersPerDegLon;
  const py = p.lat * metersPerDegLat;
  const ax = a.lon * metersPerDegLon;
  const ay = a.lat * metersPerDegLat;
  const bx = b.lon * metersPerDegLon;
  const by = b.lat * metersPerDegLat;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projY = ay + t * dy;

  return Math.hypot(px - projX, py - projY);
}

// In-memory cache for street geometries to avoid duplicate queries
const streetCache = new Map<string, { timestamp: number; ways: any[] }>();

/**
 * Checks if a building location violates the street setback rule.
 * Rule: Location must be more than 5 meters away from any street/road.
 * This check is performed entirely in the application layer.
 */
export async function checkStreetProximity(
  coord: LatLng,
  ruleDistanceMeters = 5,
): Promise<StreetProximityResult> {
  const searchRadiusMeters = 45;
  const cacheKey = `${coord.latitude.toFixed(3)}_${coord.longitude.toFixed(3)}`;
  const now = Date.now();

  let ways: any[] = [];
  const cached = streetCache.get(cacheKey);

  if (cached && now - cached.timestamp < 300000) {
    ways = cached.ways;
  } else {
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];

    for (const endpoint of endpoints) {
      try {
        const query = `[out:json][timeout:4];way["highway"](around:${searchRadiusMeters},${coord.latitude},${coord.longitude});out geom;`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(endpoint, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(query),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'BuildIran/1.0 (game-engine)',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          if (text.startsWith('{')) {
            const data = JSON.parse(text);
            ways = Array.isArray(data?.elements) ? data.elements : [];
            streetCache.set(cacheKey, { timestamp: now, ways });
            break;
          }
        }
      } catch {
        // Continue to next endpoint or fallback
      }
    }

    if (ways.length === 0 && cached) {
      ways = cached.ways;
    }
  }

  if (ways.length === 0) {
    // No street detected within search radius (45m), safely outside street zone
    return {
      isValid: true,
      distanceMeters: searchRadiusMeters,
      nearestStreetName: 'هیچ معبری در نزدیکی یافت نشد',
      ruleDistanceMeters,
      message: `موقعیت مجاز است (فاصله بیش از ${searchRadiusMeters} متر از هرگونه معبر).`,
    };
  }

  const p = { lat: coord.latitude, lon: coord.longitude };
  let minDistance = Infinity;
  let closestStreetName = 'معبر';

  for (const way of ways) {
    const geom = way.geometry;
    if (!geom || geom.length < 2) continue;

    const name = way.tags?.name || way.tags?.['name:fa'] || way.tags?.highway || 'خیابان';

    for (let i = 0; i < geom.length - 1; i++) {
      const dist = pointToSegmentDistanceMeters(p, geom[i], geom[i + 1]);
      if (dist < minDistance) {
        minDistance = dist;
        closestStreetName = name;
      }
    }
  }

  const formattedDist = Math.round(minDistance * 10) / 10;
  const isValid = minDistance > ruleDistanceMeters;

  return {
    isValid,
    distanceMeters: formattedDist,
    nearestStreetName: closestStreetName,
    ruleDistanceMeters,
    message: isValid
      ? `موقعیت مجاز برای ساخت (فاصله از «${closestStreetName}»: ${formattedDist.toLocaleString('fa-IR')} متر)`
      : `خطا: فاصله با معبر («${closestStreetName}») کمتر از ۵ متر است (${formattedDist.toLocaleString('fa-IR')} متر). ساخت روی خیابان مجاز نیست.`,
  };
}
