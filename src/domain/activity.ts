export type ActivityType = "run";

export type GeoPoint = {
  latitude: number;
  longitude: number;
  elevationMeters?: number;
  time?: Date;
};

export type Activity = {
  id: string;
  sourceUrl: string;
  name: string;
  activityType: ActivityType;
  startTime: Date;
  endTime?: Date;
  location: string;
  startPoint?: GeoPoint;
  endPoint?: GeoPoint;
  distanceMeters: number;
  movingSeconds: number;
  elevationGainMeters: number;
};

export function createActivity(input: Activity): Activity {
  if (!input.id.trim()) throw new Error("Activity id is required.");
  if (!input.sourceUrl.trim()) throw new Error("Source URL is required.");
  if (!Number.isFinite(input.startTime.getTime())) throw new Error("Activity start time is invalid.");
  if (input.distanceMeters <= 0) throw new Error("Activity distance must be greater than zero.");

  return {
    ...input,
    name: input.name.trim() || "Imported GPX run",
    location: input.location.trim() || "Unknown location"
  };
}
