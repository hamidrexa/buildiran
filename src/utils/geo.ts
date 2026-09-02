/**
 * BuildIran — Geographic Utilities
 */

import type { LatLng, Bounds } from '@/types/game.types';

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
