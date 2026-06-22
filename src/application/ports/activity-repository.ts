import type { Activity } from "../../domain/activity.ts";

export interface ActivityRepository {
  save(activity: Activity): Promise<void>;
  findAllRuns(): Promise<Activity[]>;
}
