import type { Activity } from "../../domain/activity.ts";
import type { ActivityRepository } from "../../application/ports/activity-repository.ts";
import { runSqlite, sqlNumber, sqlString } from "./sqlite-command.ts";

type ActivityRow = {
  id: string;
  source_url: string;
  name: string;
  activity_type: "run";
  start_time: string;
  end_time?: string;
  location: string;
  start_lat?: number;
  start_lon?: number;
  end_lat?: number;
  end_lon?: number;
  distance_meters: number;
  moving_seconds: number;
  elevation_gain_meters: number;
};

export class SqliteActivityRepository implements ActivityRepository {
  private readonly databasePath: string;

  constructor(databasePath: string) {
    this.databasePath = databasePath;
  }

  async save(activity: Activity): Promise<void> {
    runSqlite(this.databasePath, upsertActivitySql(activity));
  }

  async saveMany(activities: Activity[]): Promise<void> {
    if (activities.length === 0) return;
    const statements = activities.map(upsertActivitySql).join("\n");
    runSqlite(this.databasePath, `BEGIN;\n${statements}\nCOMMIT;`);
  }

  async findAllRuns(): Promise<Activity[]> {
    const output = runSqlite(this.databasePath, "SELECT * FROM activities WHERE activity_type = 'run' ORDER BY start_time ASC;", ["-json"]);
    const rows = JSON.parse(output || "[]") as ActivityRow[];
    return rows.map(rowToActivity);
  }
}

function upsertActivitySql(activity: Activity): string {
  return `
      INSERT INTO activities (
        id, source_url, name, activity_type, start_time, end_time, location,
        start_lat, start_lon, end_lat, end_lon, distance_meters, moving_seconds, elevation_gain_meters
      ) VALUES (
        ${sqlString(activity.id)},
        ${sqlString(activity.sourceUrl)},
        ${sqlString(activity.name)},
        ${sqlString(activity.activityType)},
        ${sqlString(activity.startTime.toISOString())},
        ${sqlString(activity.endTime?.toISOString())},
        ${sqlString(activity.location)},
        ${sqlNumber(activity.startPoint?.latitude)},
        ${sqlNumber(activity.startPoint?.longitude)},
        ${sqlNumber(activity.endPoint?.latitude)},
        ${sqlNumber(activity.endPoint?.longitude)},
        ${sqlNumber(activity.distanceMeters)},
        ${sqlNumber(activity.movingSeconds)},
        ${sqlNumber(activity.elevationGainMeters)}
      )
      ON CONFLICT(id) DO UPDATE SET
        source_url = excluded.source_url,
        name = excluded.name,
        activity_type = excluded.activity_type,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        location = excluded.location,
        start_lat = excluded.start_lat,
        start_lon = excluded.start_lon,
        end_lat = excluded.end_lat,
        end_lon = excluded.end_lon,
        distance_meters = excluded.distance_meters,
        moving_seconds = excluded.moving_seconds,
        elevation_gain_meters = excluded.elevation_gain_meters;
    `;
}

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    name: row.name,
    activityType: row.activity_type,
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    location: row.location,
    startPoint: row.start_lat !== undefined && row.start_lon !== undefined ? {
      latitude: Number(row.start_lat),
      longitude: Number(row.start_lon)
    } : undefined,
    endPoint: row.end_lat !== undefined && row.end_lon !== undefined ? {
      latitude: Number(row.end_lat),
      longitude: Number(row.end_lon)
    } : undefined,
    distanceMeters: Number(row.distance_meters),
    movingSeconds: Number(row.moving_seconds),
    elevationGainMeters: Number(row.elevation_gain_meters)
  };
}
