import type { RunningOverview } from "../../domain/activity-stats.ts";
import { metersToMiles } from "../../domain/distance.ts";

export function renderOverviewPage(overview: RunningOverview): string {
  const longest = overview.longestRun;
  const peakYear = overview.annualDistance.reduce((best, current) => current.miles > best.miles ? current : best, { year: 0, miles: 0 });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Strava Running Analysis</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="app-shell">
      <section class="page-head">
        <p class="eyebrow">Strava Analysis</p>
        <h1>Running overview</h1>
      </section>

      <section class="summary-grid" aria-label="Running summary">
        <article class="metric-card feature-card">
          <span>Longest run</span>
          <strong>${longest ? `${metersToMiles(longest.distanceMeters).toFixed(1)} mi` : "No runs yet"}</strong>
          <small>${longest ? `${formatDate(longest.startTime)} · ${escapeHtml(longest.location)}` : "Import a GPX file to begin"}</small>
        </article>

        <article class="metric-card">
          <span>Most popular day</span>
          <strong>${overview.mostPopularDay?.day ?? "n/a"}</strong>
          <small>${overview.mostPopularDay ? `${overview.mostPopularDay.count} runs` : "No activity history yet"}</small>
        </article>

        <article class="metric-card">
          <span>Total miles run</span>
          <strong>${overview.totalMilesRun.toFixed(1)}</strong>
          <small>Across ${overview.activityCount} imported runs</small>
        </article>

        <article class="metric-card">
          <span>Years of activity</span>
          <strong>${overview.yearsOfActivity}</strong>
          <small>Distinct calendar years represented</small>
        </article>
      </section>

      <section class="chart-panel" aria-labelledby="annual-distance-title">
        <div class="section-heading">
          <p class="eyebrow">Annual distance</p>
          <h2 id="annual-distance-title">Miles run each year</h2>
        </div>
        ${overview.annualDistance.length > 0 ? `
        <div class="bar-chart" aria-label="Bar chart showing miles run each year">
          ${overview.annualDistance.map((entry) => renderAnnualDistanceBar(entry.year, entry.miles, peakYear.miles)).join("")}
        </div>
        ` : `
        <p class="empty-copy">Import your Strava activities to see annual distance totals.</p>
        `}
      </section>
    </main>
  </body>
</html>`;
}

function renderAnnualDistanceBar(year: number, miles: number, maxMiles: number): string {
  const height = maxMiles > 0 ? Math.max(3, Math.round((miles / maxMiles) * 100)) : 0;

  return `
    <div class="bar-item">
      <div class="bar-value">${miles.toFixed(0)}</div>
      <div class="bar-track">
        <div class="bar-fill" style="height: ${height}%"></div>
      </div>
      <div class="bar-label">${year}</div>
    </div>
  `;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
