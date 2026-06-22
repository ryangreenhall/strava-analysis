import { createHash } from "node:crypto";
import { createActivity, type Activity, type GeoPoint } from "../../domain/activity.ts";
import { pathDistanceMeters } from "../../domain/distance.ts";
import type { ActivityImporter } from "../../application/ports/activity-importer.ts";

type GpxPoint = GeoPoint & {
  elevationMeters: number;
  time: Date;
};

export class GpxUrlImporter implements ActivityImporter {
  async importFromUrl(url: string): Promise<Activity> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not download GPX: ${response.status} ${response.statusText}`);

    const gpx = await response.text();
    const points = parseTrackPoints(gpx);
    if (points.length < 2) throw new Error("GPX file must contain at least two track points.");

    const name = textContent(gpx, "name") ?? "Imported GPX run";
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const distanceMeters = pathDistanceMeters(points);
    const movingSeconds = Math.max(0, Math.round((endPoint.time.getTime() - startPoint.time.getTime()) / 1000));
    const elevationGainMeters = calculateElevationGain(points);
    const location = `${startPoint.latitude.toFixed(4)}, ${startPoint.longitude.toFixed(4)}`;
    const id = createHash("sha256").update(`${url}:${startPoint.time.toISOString()}:${distanceMeters.toFixed(1)}`).digest("hex").slice(0, 24);

    return createActivity({
      id,
      sourceUrl: url,
      name,
      activityType: "run",
      startTime: startPoint.time,
      endTime: endPoint.time,
      location,
      startPoint,
      endPoint,
      distanceMeters,
      movingSeconds,
      elevationGainMeters
    });
  }
}

function parseTrackPoints(gpx: string): GpxPoint[] {
  const pointPattern = /<trkpt\b[^>]*lat=["']([^"']+)["'][^>]*lon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/trkpt>/gi;
  const points: GpxPoint[] = [];
  let match: RegExpExecArray | null;

  while ((match = pointPattern.exec(gpx))) {
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    const body = match[3];
    const elevationMeters = Number(textContent(body, "ele") ?? 0);
    const timeRaw = textContent(body, "time");
    const time = timeRaw ? new Date(timeRaw) : new Date(0);

    if (Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(time.getTime())) {
      points.push({ latitude, longitude, elevationMeters, time });
    }
  }

  return points;
}

function textContent(xml: string, tagName: string): string | undefined {
  const match = xml.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function calculateElevationGain(points: GpxPoint[]): number {
  return points.slice(1).reduce((gain, point, index) => {
    const delta = point.elevationMeters - points[index].elevationMeters;
    return gain + Math.max(0, delta);
  }, 0);
}
