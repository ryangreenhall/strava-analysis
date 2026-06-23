import type { ServerResponse } from "node:http";
import type { GetMonthRunningOverview } from "../../application/use-cases/get-month-running-overview.ts";
import { renderMonthOverviewPage } from "../views/month-overview-view.ts";

export class MonthOverviewController {
  private readonly getMonthRunningOverview: GetMonthRunningOverview;

  constructor(getMonthRunningOverview: GetMonthRunningOverview) {
    this.getMonthRunningOverview = getMonthRunningOverview;
  }

  async show(year: number, month: number, response: ServerResponse): Promise<void> {
    const overview = await this.getMonthRunningOverview.execute(year, month);
    const html = renderMonthOverviewPage(overview);
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
  }
}
