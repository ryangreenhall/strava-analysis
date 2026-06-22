import { databasePath } from "../config.ts";
import { metersToMiles } from "../domain/distance.ts";
import { ImportGpxActivity } from "../application/use-cases/import-gpx-activity.ts";
import { GpxUrlImporter } from "../infrastructure/gpx/gpx-url-importer.ts";
import { SqliteActivityRepository } from "../infrastructure/sqlite/sqlite-activity-repository.ts";
import { SqliteMigrator } from "../infrastructure/sqlite/migrator.ts";

const url = process.argv[2];

if (!url || url === "--help" || url === "-h") {
  console.log("Usage: node src/cli/import-gpx.ts <gpx-url>");
  console.log("");
  console.log("Example:");
  console.log("  node src/cli/import-gpx.ts https://example.com/run.gpx");
  process.exit(url ? 0 : 1);
}

new SqliteMigrator(databasePath).run();

const useCase = new ImportGpxActivity(
  new GpxUrlImporter(),
  new SqliteActivityRepository(databasePath)
);

const activity = await useCase.execute(url);

console.log("Imported GPX run:");
console.log(`- Name: ${activity.name}`);
console.log(`- Date: ${activity.startTime.toLocaleDateString()}`);
console.log(`- Location: ${activity.location}`);
console.log(`- Distance: ${metersToMiles(activity.distanceMeters).toFixed(2)} miles`);
console.log(`- Database: ${databasePath}`);
