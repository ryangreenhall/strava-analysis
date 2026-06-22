const fileInput = document.querySelector("#fileInput");
const loadSampleButton = document.querySelector("#loadSample");
const yearFilter = document.querySelector("#yearFilter");
const metricFilter = document.querySelector("#metricFilter");
const metricGrid = document.querySelector("#metricGrid");
const activityTable = document.querySelector("#activityTable");
const dashboardTitle = document.querySelector("#dashboardTitle");
const dataStatus = document.querySelector("#dataStatus");
const trendTitle = document.querySelector("#trendTitle");
const activityCount = document.querySelector("#activityCount");
const summaryNarrative = document.querySelector("#summaryNarrative");
const trendCanvas = document.querySelector("#trendChart");
const distributionCanvas = document.querySelector("#distributionChart");

const metersPerMile = 1609.344;
const metersPerKm = 1000;
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let activities = [];

const sampleActivities = [
  { name: "Morning Run", date: "2025-01-05", distanceMeters: 7200, movingSeconds: 2268, elevationMeters: 68 },
  { name: "Tempo Session", date: "2025-01-18", distanceMeters: 9400, movingSeconds: 2780, elevationMeters: 84 },
  { name: "Park Loops", date: "2025-02-03", distanceMeters: 5600, movingSeconds: 1760, elevationMeters: 39 },
  { name: "Long Steady Run", date: "2025-02-22", distanceMeters: 16100, movingSeconds: 5420, elevationMeters: 128 },
  { name: "Easy Miles", date: "2025-03-08", distanceMeters: 8100, movingSeconds: 2528, elevationMeters: 64 },
  { name: "Progression Run", date: "2025-03-27", distanceMeters: 11200, movingSeconds: 3420, elevationMeters: 97 },
  { name: "Trail Run", date: "2025-04-14", distanceMeters: 13300, movingSeconds: 4660, elevationMeters: 244 },
  { name: "Recovery Jog", date: "2025-05-02", distanceMeters: 4800, movingSeconds: 1650, elevationMeters: 35 },
  { name: "Half Marathon Build", date: "2025-05-24", distanceMeters: 18500, movingSeconds: 6250, elevationMeters: 142 },
  { name: "Club Intervals", date: "2025-06-11", distanceMeters: 10200, movingSeconds: 3065, elevationMeters: 72 },
  { name: "Sunday Long Run", date: "2025-07-06", distanceMeters: 21100, movingSeconds: 7160, elevationMeters: 188 },
  { name: "Summer 10K", date: "2025-08-17", distanceMeters: 10000, movingSeconds: 2915, elevationMeters: 55 }
];

function normalizeKey(key) {
  return String(key).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDuration(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const raw = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) return Number(raw);
  const parts = raw.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map(normalizeKey);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] ?? "";
      return row;
    }, {});
  });
}

function firstValue(row, keys) {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (row[normalized] !== undefined && row[normalized] !== "") return row[normalized];
  }
  return "";
}

function normalizeActivity(row) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]));
  const type = firstValue(normalized, ["activity_type", "type", "sport_type"]);
  const name = firstValue(normalized, ["activity_name", "name"]) || "Untitled run";
  const dateValue = firstValue(normalized, ["activity_date", "start_date", "start_date_local", "date"]);
  const date = new Date(dateValue);
  const distanceRaw = parseNumber(firstValue(normalized, ["distance", "distance_m", "distance_meters"]));
  const distanceMeters = distanceRaw > 500 ? distanceRaw : distanceRaw * metersPerKm;
  const movingSeconds = parseDuration(firstValue(normalized, ["moving_time", "moving_time_seconds", "elapsed_time"]));
  const elevationMeters = parseNumber(firstValue(normalized, ["elevation_gain", "total_elevation_gain", "elevation"]));

  if (type && !String(type).toLowerCase().includes("run")) return null;
  if (!Number.isFinite(date.getTime()) || distanceMeters <= 0) return null;

  return { name, date, distanceMeters, movingSeconds, elevationMeters };
}

function setActivities(nextActivities) {
  activities = nextActivities.map(normalizeActivity).filter(Boolean).sort((a, b) => a.date - b.date);
  populateYearFilter();
  render();
}

function populateYearFilter() {
  const years = [...new Set(activities.map((activity) => activity.date.getFullYear()))].sort((a, b) => b - a);
  yearFilter.innerHTML = `<option value="all">All years</option>${years.map((year) => `<option value="${year}">${year}</option>`).join("")}`;
  if (years.length) yearFilter.value = String(years[0]);
}

function selectedActivities() {
  const year = yearFilter.value;
  return year === "all" ? activities : activities.filter((activity) => String(activity.date.getFullYear()) === year);
}

function summarize(rows) {
  const totalDistanceMeters = rows.reduce((sum, activity) => sum + activity.distanceMeters, 0);
  const totalMovingSeconds = rows.reduce((sum, activity) => sum + activity.movingSeconds, 0);
  const totalElevationMeters = rows.reduce((sum, activity) => sum + activity.elevationMeters, 0);
  const longestRun = rows.reduce((best, activity) => activity.distanceMeters > best.distanceMeters ? activity : best, { distanceMeters: 0 });
  const averagePace = totalDistanceMeters > 0 ? totalMovingSeconds / (totalDistanceMeters / metersPerMile) : 0;

  return { totalDistanceMeters, totalMovingSeconds, totalElevationMeters, longestRun, averagePace };
}

function formatDistance(meters) {
  return `${(meters / metersPerMile).toFixed(1)} mi`;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatPace(secondsPerMile) {
  if (!secondsPerMile) return "n/a";
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.round(secondsPerMile % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}/mi`;
}

function renderMetrics(rows) {
  const stats = summarize(rows);
  const cards = [
    ["Runs", rows.length.toLocaleString(), "Filtered activities"],
    ["Distance", formatDistance(stats.totalDistanceMeters), "Total covered"],
    ["Time", formatDuration(stats.totalMovingSeconds), "Moving time"],
    ["Avg pace", formatPace(stats.averagePace), "Weighted by distance"]
  ];

  metricGrid.innerHTML = cards.map(([label, value, note]) => `
    <article class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
    </article>
  `).join("");

  if (!rows.length) {
    summaryNarrative.textContent = "Load activities to generate a concise story about your training.";
    return;
  }

  summaryNarrative.textContent = `You logged ${formatDistance(stats.totalDistanceMeters)} across ${rows.length} runs, with a longest effort of ${formatDistance(stats.longestRun.distanceMeters)} and an average pace of ${formatPace(stats.averagePace)}.`;
}

function monthlySeries(rows, metric) {
  const values = Array.from({ length: 12 }, () => 0);
  rows.forEach((activity) => {
    const month = activity.date.getMonth();
    if (metric === "distance") values[month] += activity.distanceMeters / metersPerMile;
    if (metric === "time") values[month] += activity.movingSeconds / 3600;
    if (metric === "elevation") values[month] += activity.elevationMeters;
  });
  return values;
}

function drawBarChart(canvas, labels, values, options = {}) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 24, right: 24, bottom: 42, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...values, 1);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#d8ded8";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (plotHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  const gap = 12;
  const barWidth = Math.max(12, (plotWidth - gap * (values.length - 1)) / values.length);
  values.forEach((value, index) => {
    const x = padding.left + index * (barWidth + gap);
    const barHeight = (value / maxValue) * plotHeight;
    const y = padding.top + plotHeight - barHeight;
    ctx.fillStyle = options.colors?.[index] ?? "#fc4c02";
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "#647074";
    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[index], x + barWidth / 2, height - 14);
  });
}

function renderTrend(rows) {
  const metric = metricFilter.value;
  const unit = metric === "distance" ? "mi" : metric === "time" ? "hours" : "m";
  const labels = monthLabels;
  const values = monthlySeries(rows, metric);
  trendTitle.textContent = `Monthly ${metric === "time" ? "moving time" : metric}`;
  drawBarChart(trendCanvas, labels, values, { colors: values.map((_, index) => index % 2 ? "#0f7b78" : "#fc4c02") });

  const ctx = trendCanvas.getContext("2d");
  ctx.fillStyle = "#1e2528";
  ctx.font = "800 15px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(unit, 12, 22);
}

function renderDistribution(rows) {
  const buckets = [
    ["0-5", 0, 5],
    ["5-10", 5, 10],
    ["10-13.1", 10, 13.1],
    ["13.1+", 13.1, Infinity]
  ];
  const values = buckets.map(([, min, max]) => rows.filter((activity) => {
    const miles = activity.distanceMeters / metersPerMile;
    return miles >= min && miles < max;
  }).length);

  drawBarChart(distributionCanvas, buckets.map(([label]) => label), values, {
    colors: ["#d9a21b", "#fc4c02", "#0f7b78", "#1e2528"]
  });
}

function renderTable(rows) {
  activityCount.textContent = `${rows.length.toLocaleString()} activities`;
  const longest = [...rows].sort((a, b) => b.distanceMeters - a.distanceMeters).slice(0, 8);

  if (!longest.length) {
    activityTable.innerHTML = `<tr><td class="empty-state" colspan="5">Import data to see your longest runs.</td></tr>`;
    return;
  }

  activityTable.innerHTML = longest.map((activity) => {
    const pace = activity.movingSeconds / (activity.distanceMeters / metersPerMile);
    return `
      <tr>
        <td>${activity.name}</td>
        <td>${activity.date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</td>
        <td>${formatDistance(activity.distanceMeters)}</td>
        <td>${formatPace(pace)}</td>
        <td>${Math.round(activity.elevationMeters).toLocaleString()} m</td>
      </tr>
    `;
  }).join("");
}

function render() {
  const rows = selectedActivities();
  const yearLabel = yearFilter.value === "all" ? "all years" : yearFilter.value;
  dashboardTitle.textContent = rows.length ? `Running analysis for ${yearLabel}` : "Ready for your runs";
  dataStatus.textContent = rows.length ? `${rows.length.toLocaleString()} runs loaded` : "No data loaded";
  renderMetrics(rows);
  renderTrend(rows);
  renderDistribution(rows);
  renderTable(rows);
}

async function handleFileUpload(file) {
  const text = await file.text();
  const rows = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
  setActivities(Array.isArray(rows) ? rows : rows.activities ?? []);
}

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) handleFileUpload(file).catch((error) => {
    summaryNarrative.textContent = `Import failed: ${error.message}`;
  });
});

loadSampleButton.addEventListener("click", () => setActivities(sampleActivities));
yearFilter.addEventListener("change", render);
metricFilter.addEventListener("change", render);

setActivities([]);
