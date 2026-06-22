import { databasePath } from "../config.ts";
import { ImportStravaActivitiesCsv } from "../application/use-cases/import-strava-activities-csv.ts";
import { StravaActivitiesCsvReader } from "../infrastructure/csv/strava-activities-csv-reader.ts";
import { SqliteActivityRepository } from "../infrastructure/sqlite/sqlite-activity-repository.ts";
import { SqliteMigrator } from "../infrastructure/sqlite/migrator.ts";

const csvPath = process.argv[2];

if (!csvPath || csvPath === "--help" || csvPath === "-h") {
  console.log("Usage: node src/cli/import-strava-activities-csv.ts <path-to-activities.csv>");
  console.log("");
  console.log("Example:");
  console.log("  node src/cli/import-strava-activities-csv.ts /Users/ryangreenhall/Documents/data/strava-export/activities.csv");
  process.exit(csvPath ? 0 : 1);
}

new SqliteMigrator(databasePath).run();

const useCase = new ImportStravaActivitiesCsv(
  new StravaActivitiesCsvReader(),
  new SqliteActivityRepository(databasePath)
);

const result = await useCase.execute(csvPath);

console.log("Imported Strava activities CSV:");
console.log(`- Imported runs: ${result.importedCount}`);
console.log(`- Skipped rows: ${result.skippedRows}`);
console.log(`- Database: ${databasePath}`);
