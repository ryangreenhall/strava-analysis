import type { MonthRunningOverview } from "../../domain/activity-stats.ts";

const monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function renderMonthOverviewPage(overview: MonthRunningOverview): string {
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
          <p class="eyebrow">Training calendar</p>
          <h2 id="daily-distance-title">Runs by day</h2>
        </div>
        ${overview.dailyDistance.some((entry) => entry.miles > 0) ? `
        <div class="calendar-grid" aria-label="Calendar showing miles run each day in ${monthName} ${overview.year}">
          ${weekdayLabels.map((label) => `<div class="weekday-heading">${label}</div>`).join("")}
          ${renderCalendarCells(overview)}
        </div>
        ` : `
        <p class="empty-copy">No imported runs for ${monthName} ${overview.year}.</p>
        `}
      </section>
    </main>
  </body>
</html>`;
}

function renderCalendarCells(overview: MonthRunningOverview): string {
  const firstDay = new Date(overview.year, overview.month - 1, 1);
  const mondayStartOffset = (firstDay.getDay() + 6) % 7;
  const leadingDays = Array.from({ length: mondayStartOffset }, () => `<div class="calendar-day calendar-day-empty"></div>`);
  const activeDays = overview.dailyDistance.map((entry) => renderCalendarDay(entry.day, entry.miles));

  return [...leadingDays, ...activeDays].join("");
}

function renderCalendarDay(day: number, miles: number): string {
  const hasRun = miles > 0;

  return `
    <div class="calendar-day${hasRun ? " calendar-day-run" : ""}">
      <div class="calendar-date">${day}</div>
      ${hasRun ? `
      <div class="runner-mark" aria-hidden="true">
        <svg viewBox="0 0 28 28" role="img" focusable="false">
          <circle cx="16" cy="7" r="3.1"></circle>
          <path class="runner-body" d="M14.5 9.5c-1.3 1.1-2.4 2.7-3.2 4.8l4.4 2.2 3.8-3.4c.8-.7.9-1.9.2-2.7-.7-.8-1.9-.9-2.7-.2l-1.6 1.4-.9-2.1z"></path>
          <path d="M15.6 16.4l4.2 6.1"></path>
          <path d="M15.5 16.5l-5.6 5.1"></path>
          <path d="M12 13.8l-4.1 1.8"></path>
          <path d="M18.7 12.9l3.5 1.6"></path>
        </svg>
      </div>
      <div class="calendar-miles">${miles.toFixed(1)} mi</div>
      ` : ""}
    </div>
  `;
}
