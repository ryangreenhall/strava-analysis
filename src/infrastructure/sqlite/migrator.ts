import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { runSqlite, sqlString } from "./sqlite-command.ts";

export class SqliteMigrator {
  private readonly databasePath: string;
  private readonly migrationsDirectory: string;

  constructor(databasePath: string, migrationsDirectory = "migrations") {
    this.databasePath = databasePath;
    this.migrationsDirectory = migrationsDirectory;
  }

  run(): string[] {
    const databaseDirectory = dirname(this.databasePath);
    if (!existsSync(databaseDirectory)) mkdirSync(databaseDirectory, { recursive: true });

    runSqlite(this.databasePath, "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);");
    const applied = new Set(JSON.parse(runSqlite(this.databasePath, "SELECT version FROM schema_migrations ORDER BY version;", ["-json"]) || "[]").map((row: { version: string }) => row.version));
    const migrations = readdirSync(this.migrationsDirectory).filter((file) => file.endsWith(".sql")).sort();
    const appliedNow: string[] = [];

    for (const migration of migrations) {
      if (applied.has(migration)) continue;
      const migrationSql = readFileSync(join(this.migrationsDirectory, migration), "utf8");
      runSqlite(this.databasePath, `BEGIN;\n${migrationSql}\nINSERT INTO schema_migrations (version) VALUES (${sqlString(migration)});\nCOMMIT;`);
      appliedNow.push(migration);
    }

    return appliedNow;
  }
}
