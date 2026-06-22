import type { ActivityRepository } from "../ports/activity-repository.ts";
import { calculateRunningOverview, type RunningOverview } from "../../domain/activity-stats.ts";

export class GetRunningOverview {
  private readonly repository: ActivityRepository;

  constructor(repository: ActivityRepository) {
    this.repository = repository;
  }

  async execute(): Promise<RunningOverview> {
    const activities = await this.repository.findAllRuns();
    return calculateRunningOverview(activities);
  }
}
