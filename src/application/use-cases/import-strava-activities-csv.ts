import type { ActivityRepository } from "../ports/activity-repository.ts";
import { StravaActivitiesCsvReader } from "../../infrastructure/csv/strava-activities-csv-reader.ts";

export type ImportStravaActivitiesCsvResult = {
  importedCount: number;
  skippedRows: number;
};

export class ImportStravaActivitiesCsv {
  private readonly reader: StravaActivitiesCsvReader;
  private readonly repository: ActivityRepository;

  constructor(reader: StravaActivitiesCsvReader, repository: ActivityRepository) {
    this.reader = reader;
    this.repository = repository;
  }

  async execute(filePath: string): Promise<ImportStravaActivitiesCsvResult> {
    const result = await this.reader.read(filePath);

    await this.repository.saveMany(result.activities);

    return {
      importedCount: result.activities.length,
      skippedRows: result.skippedRows
    };
  }
}
