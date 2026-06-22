# Strava Analysis

A local TypeScript app for importing GPX running data, storing it in SQLite, and presenting a compact running overview.

The code is organised in a hexagonal style:

- `src/domain`: activity model, distance calculations, and statistics
- `src/application`: use cases and ports
- `src/infrastructure`: SQLite and GPX URL adapters
- `src/presentation`: MVC HTTP controller and view
- `src/cli`: command-line entry points

## Requirements

- Node.js 24+
- SQLite CLI (`sqlite3`)

This project intentionally avoids npm dependencies for now.

## Run migrations

```bash
node src/cli/migrate.ts
```

## Import a GPX file from a URL

```bash
node src/cli/import-gpx.ts https://example.com/my-run.gpx
```

The importer downloads the GPX file, calculates distance from track points, estimates moving time from the first and last timestamps, calculates elevation gain, and stores the activity in `data/strava-analysis.sqlite`.

## Import Strava bulk export activities

```bash
node src/cli/import-strava-activities-csv.ts /Users/ryangreenhall/Documents/data/strava-export/activities.csv
```

This imports rows where `Activity Type` is `Run`. The Strava bulk export does not include location names in `activities.csv`, so imported CSV rows use `Location unavailable in activities.csv`.

## Run the web page

```bash
node src/presentation/http/server.ts
```

Open `http://127.0.0.1:5173`.

The page shows:

- Longest run, with date and location
- Most popular day of the week
- Total miles run
- Number of years of activity
