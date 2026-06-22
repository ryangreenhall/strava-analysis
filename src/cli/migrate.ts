import { databasePath } from "../config.ts";
import { SqliteMigrator } from "../infrastructure/sqlite/migrator.ts";

const applied = new SqliteMigrator(databasePath).run();

if (applied.length === 0) {
  console.log(`Database is up to date: ${databasePath}`);
} else {
  console.log(`Applied migrations to ${databasePath}:`);
  for (const migration of applied) console.log(`- ${migration}`);
}
