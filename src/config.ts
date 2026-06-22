import { join } from "node:path";

export const databasePath = process.env.STRAVA_ANALYSIS_DB ?? join(process.cwd(), "data", "strava-analysis.sqlite");
export const port = Number(process.env.PORT ?? 5173);
