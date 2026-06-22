import type { Activity } from "../../domain/activity.ts";

export interface ActivityImporter {
  importFromUrl(url: string): Promise<Activity>;
}
