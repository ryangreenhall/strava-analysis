import { spawnSync } from "node:child_process";

export function runSqlite(databasePath: string, sql: string, args: string[] = []): string {
  const result = spawnSync("sqlite3", [...args, databasePath], {
    input: sql,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "sqlite3 command failed.");
  }

  return result.stdout;
}

export function sqlString(value: string | undefined): string {
  if (value === undefined) return "NULL";
  return `'${value.replaceAll("'", "''")}'`;
}

export function sqlNumber(value: number | undefined): string {
  return value === undefined || Number.isNaN(value) ? "NULL" : String(value);
}
