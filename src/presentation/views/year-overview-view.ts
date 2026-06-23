import type { YearRunningOverview } from "../../domain/activity-stats.ts";
import { metersToMiles } from "../../domain/distance.ts";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function renderYearOverviewPage(overview: YearRunningOverview): string {
  const longest = overview.longestRun;
  const peakMonth = overview.monthlyDistance.reduce((best, current) => current.miles > best.miles ? current : best, { month: 0, miles: 0 });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${overview.year} Running Analysis</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="app-shell">
      <section class="page-head year-head">
        <a class="back-link" href="/">Overview</a>
        <p class="eyebrow">Year detail</p>
        <div class="year-title-row" aria-label="Year navigation">
          ${overview.previousYear ? `<a class="year-nav-link" href="/runs/${overview.previousYear}" aria-label="Previous year ${overview.previousYear}">&lt;</a>` : `<span class="year-nav-link nav-disabled" aria-label="No previous year">&lt;</span>`}
          <h1>${overview.year}</h1>
          ${overview.nextYear ? `<a class="year-nav-link" href="/runs/${overview.nextYear}" aria-label="Next year ${overview.nextYear}">&gt;</a>` : `<span class="year-nav-link nav-disabled" aria-label="No next year">&gt;</span>`}
        </div>
      </section>

      <section class="summary-grid" aria-label="${overview.year} running summary">
        <article class="metric-card feature-card">
          <span>Longest run</span>
          <strong>${longest ? `${metersToMiles(longest.distanceMeters).toFixed(1)} mi` : "No runs"}</strong>
          <small>${longest ? `${formatDate(longest.startTime)} · ${escapeHtml(longest.location)}` : "No imported runs for this year"}</small>
        </article>

        <article class="metric-card">
          <span>Most popular day</span>
          <strong>${overview.mostPopularDay?.day ?? "n/a"}</strong>
          <small>${overview.mostPopularDay ? `${overview.mostPopularDay.count} runs` : "No activity history yet"}</small>
        </article>

        <article class="metric-card">
          <span>Fastest 5K</span>
          <strong>${overview.fastest5k ? formatDuration(overview.fastest5k.estimatedSeconds) : "n/a"}</strong>
          <small>${formatFastest5kComparison(overview)}</small>
        </article>

        <article class="metric-card">
          <span>Total miles run</span>
          <strong>${overview.totalMilesRun.toFixed(1)}</strong>
          <small>Across ${overview.activityCount} imported runs</small>
        </article>
      </section>

      <section class="chart-panel" aria-labelledby="monthly-distance-title">
        <div class="section-heading">
          <p class="eyebrow">Monthly distance</p>
          <h2 id="monthly-distance-title">Miles run each month</h2>
        </div>
        ${overview.monthlyDistance.some((entry) => entry.miles > 0) ? `
        <div class="bar-chart monthly-chart" aria-label="Bar chart showing miles run each month in ${overview.year}">
          ${overview.monthlyDistance.map((entry) => renderMonthlyDistanceBar(overview.year, entry.month, entry.miles, peakMonth.miles)).join("")}
        </div>
        ` : `
        <p class="empty-copy">No imported runs for ${overview.year}.</p>
        `}
      </section>
    </main>
  </body>
</html>`;
}

function renderMonthlyDistanceBar(year: number, month: number, miles: number, maxMiles: number): string {
  const height = maxMiles > 0 && miles > 0 ? Math.max(3, Math.round((miles / maxMiles) * 100)) : 0;

  return `
    <div class="bar-item">
      <div class="bar-value">${miles > 0 ? miles.toFixed(0) : ""}</div>
      <a class="bar-track bar-link" href="/runs/${year}/${month}" aria-label="View ${monthLabels[month - 1]} ${year} running detail">
        <span class="bar-fill" style="height: ${height}%"></span>
      </a>
      <div class="bar-label">${monthLabels[month - 1]}</div>
    </div>
  `;
}

function formatFastest5kComparison(overview: YearRunningOverview): string {
  if (!overview.fastest5k) return "No qualifying run this year";
  const date = formatDate(overview.fastest5k.activity.startTime);
  if (!overview.allTimeFastest5k) return `${date} · no all-time comparison`;

  const deltaSeconds = overview.fastest5k.estimatedSeconds - overview.allTimeFastest5k.estimatedSeconds;
  const bestEver = formatDuration(overview.allTimeFastest5k.estimatedSeconds);
  if (deltaSeconds === 0) return `${date} · best ever ${bestEver}`;
  if (deltaSeconds > 0) return `${date} · best ever ${bestEver}, ${formatDuration(deltaSeconds)} slower`;
  return `${date} · best ever ${bestEver}, ${formatDuration(Math.abs(deltaSeconds))} faster`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60).toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
