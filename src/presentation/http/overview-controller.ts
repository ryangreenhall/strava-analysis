import type { ServerResponse } from "node:http";
import type { GetRunningOverview } from "../../application/use-cases/get-running-overview.ts";
import { renderOverviewPage } from "../views/overview-view.ts";

export class OverviewController {
  private readonly getRunningOverview: GetRunningOverview;

  constructor(getRunningOverview: GetRunningOverview) {
    this.getRunningOverview = getRunningOverview;
  }

  async show(response: ServerResponse): Promise<void> {
    const overview = await this.getRunningOverview.execute();
    const html = renderOverviewPage(overview);
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
  }
}
