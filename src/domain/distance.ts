import type { GeoPoint } from "./activity.ts";

const earthRadiusMeters = 6371000;
export const metersPerMile = 1609.344;

function toRadians(value: number): number {
  return value * Math.PI / 180;
}

export function distanceBetweenMeters(a: GeoPoint, b: GeoPoint): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function pathDistanceMeters(points: GeoPoint[]): number {
  return points.slice(1).reduce((total, point, index) => total + distanceBetweenMeters(points[index], point), 0);
}

export function metersToMiles(meters: number): number {
  return meters / metersPerMile;
}
