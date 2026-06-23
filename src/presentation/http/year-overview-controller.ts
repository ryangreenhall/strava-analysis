import type { ServerResponse } from "node:http";
import type { GetYearRunningOverview } from "../../application/use-cases/get-year-running-overview.ts";
import { renderYearOverviewPage } from "../views/year-overview-view.ts";

export class YearOverviewController {
  private readonly getYearRunningOverview: GetYearRunningOverview;

  constructor(getYearRunningOverview: GetYearRunningOverview) {
    this.getYearRunningOverview = getYearRunningOverview;
  }

  async show(year: number, response: ServerResponse): Promise<void> {
    const overview = await this.getYearRunningOverview.execute(year);
    const html = renderYearOverviewPage(overview);
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
  }
}
