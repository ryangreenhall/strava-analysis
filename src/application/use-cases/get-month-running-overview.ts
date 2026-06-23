import type { ActivityRepository } from "../ports/activity-repository.ts";
import { calculateMonthRunningOverview, type MonthRunningOverview } from "../../domain/activity-stats.ts";

export class GetMonthRunningOverview {
  private readonly repository: ActivityRepository;

  constructor(repository: ActivityRepository) {
    this.repository = repository;
  }

  async execute(year: number, month: number): Promise<MonthRunningOverview> {
    const activities = await this.repository.findAllRuns();
    return calculateMonthRunningOverview(activities, year, month);
  }
}
