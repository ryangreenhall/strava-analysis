import type { MonthRunningOverview } from "../../domain/activity-stats.ts";

const monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function renderMonthOverviewPage(overview: MonthRunningOverview): string {
  const peakDay = overview.dailyDistance.reduce((best, current) => current.miles > best.miles ? current : best, { day: 0, miles: 0 });
  const monthName = monthLabels[overview.month - 1] ?? `Month ${overview.month}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${monthName} ${overview.year} Running Analysis</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="app-shell">
      <section class="page-head year-head">
        <a class="back-link" href="/runs/${overview.year}">${overview.year}</a>
        <p class="eyebrow">Month detail</p>
        <h1>${monthName}</h1>
      </section>

      <section class="summary-grid" aria-label="${monthName} ${overview.year} running summary">
        <article class="metric-card feature-card">
          <span>Total miles run</span>
          <strong>${overview.totalMilesRun.toFixed(1)}</strong>
          <small>Across ${overview.activityCount} imported runs in ${monthName} ${overview.year}</small>
        </article>
      </section>

      <section class="chart-panel" aria-labelledby="daily-distance-title">
        <div class="section-heading">
          <p class="eyebrow">Daily distance</p>
          <h2 id="daily-distance-title">Miles run each day</h2>
        </div>
        ${overview.dailyDistance.some((entry) => entry.miles > 0) ? `
        <div class="bar-chart daily-chart" aria-label="Bar chart showing miles run each day in ${monthName} ${overview.year}">
          ${overview.dailyDistance.map((entry) => renderDailyDistanceBar(entry.day, entry.miles, peakDay.miles)).join("")}
        </div>
        ` : `
        <p class="empty-copy">No imported runs for ${monthName} ${overview.year}.</p>
        `}
      </section>
    </main>
  </body>
</html>`;
}

function renderDailyDistanceBar(day: number, miles: number, maxMiles: number): string {
  const height = maxMiles > 0 && miles > 0 ? Math.max(3, Math.round((miles / maxMiles) * 100)) : 0;

  return `
    <div class="bar-item daily-bar-item">
      <div class="bar-value">${miles > 0 ? miles.toFixed(1) : ""}</div>
      <div class="bar-track">
        <div class="bar-fill" style="height: ${height}%"></div>
      </div>
      <div class="bar-label">${day}</div>
    </div>
  `;
}
