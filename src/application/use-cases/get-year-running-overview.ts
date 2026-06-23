import type { ActivityRepository } from "../ports/activity-repository.ts";
import { calculateYearRunningOverview, type YearRunningOverview } from "../../domain/activity-stats.ts";

export class GetYearRunningOverview {
  private readonly repository: ActivityRepository;

  constructor(repository: ActivityRepository) {
    this.repository = repository;
  }

  async execute(year: number): Promise<YearRunningOverview> {
    const activities = await this.repository.findAllRuns();
    return calculateYearRunningOverview(activities, year);
  }
}
