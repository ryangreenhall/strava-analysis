import type { ActivityImporter } from "../ports/activity-importer.ts";
import type { ActivityRepository } from "../ports/activity-repository.ts";
import type { Activity } from "../../domain/activity.ts";

export class ImportGpxActivity {
  private readonly importer: ActivityImporter;
  private readonly repository: ActivityRepository;

  constructor(importer: ActivityImporter, repository: ActivityRepository) {
    this.importer = importer;
    this.repository = repository;
  }

  async execute(url: string): Promise<Activity> {
    const activity = await this.importer.importFromUrl(url);
    await this.repository.save(activity);
    return activity;
  }
}
