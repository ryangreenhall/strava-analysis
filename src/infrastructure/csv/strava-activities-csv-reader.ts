import { readFile } from "node:fs/promises";
import { createActivity, type Activity } from "../../domain/activity.ts";

type CsvRow = Record<string, string[]>;

export type StravaActivitiesCsvImportResult = {
  activities: Activity[];
  skippedRows: number;
};

export class StravaActivitiesCsvReader {
  async read(filePath: string): Promise<StravaActivitiesCsvImportResult> {
    const csv = await readFile(filePath, "utf8");
    const rows = parseCsv(csv);
    const activities: Activity[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      const activity = rowToActivity(row, filePath);
      if (activity) {
        activities.push(activity);
      } else {
        skippedRows += 1;
      }
    }

    return { activities, skippedRows };
  }
}

function rowToActivity(row: CsvRow, sourcePath: string): Activity | undefined {
  const activityType = firstValue(row, "Activity Type", "Type");
  if (activityType.toLowerCase() !== "run") return undefined;

  const id = firstValue(row, "Activity ID");
  const startTime = parseStravaDate(firstValue(row, "Activity Date", "Start Time"));
  const distanceMeters = parseDistanceMeters(row);

  if (!id || !startTime || distanceMeters <= 0) return undefined;

  return createActivity({
    id,
    sourceUrl: sourcePath,
    name: firstValue(row, "Activity Name") || "Strava run",
    activityType: "run",
    startTime,
    endTime: undefined,
    location: "Location unavailable in activities.csv",
    distanceMeters,
    movingSeconds: Math.round(parseNumber(firstValue(row, "Moving Time", "Elapsed Time"))),
    elevationGainMeters: parseNumber(firstValue(row, "Elevation Gain"))
  });
}

function parseCsv(csv: string): CsvRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      const key = normalizeHeader(header);
      row[key] ??= [];
      row[key].push(cells[index] ?? "");
    });

    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function firstValue(row: CsvRow, ...headers: string[]): string {
  for (const header of headers) {
    const values = row[normalizeHeader(header)] ?? [];
    const value = values.find((candidate) => candidate.trim().length > 0);
    if (value) return value.trim();
  }

  return "";
}

function parseDistanceMeters(row: CsvRow): number {
  const distances = row[normalizeHeader("Distance")] ?? [];
  const numericDistances = distances.map(parseNumber).filter((value) => value > 0);
  const meterDistance = numericDistances.find((value) => value > 500);
  if (meterDistance) return meterDistance;

  const kilometerDistance = numericDistances[0] ?? 0;
  return kilometerDistance * 1000;
}

function parseStravaDate(value: string): Date | undefined {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function parseNumber(value: string): number {
  if (!value) return 0;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
