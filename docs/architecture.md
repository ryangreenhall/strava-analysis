# Strava Analysis Architecture

This project follows a small hexagonal architecture with a command-line import path, a SQLite persistence adapter, and server-rendered MVC pages.

## C4 Level 1: System Context

```mermaid
flowchart LR
  user["Runner / App User"]
  strava["Strava Bulk Export<br/>activities.csv + GPX files"]
  app["Strava Analysis<br/>Local TypeScript web app"]
  sqlite["SQLite Database<br/>data/strava-analysis.sqlite"]
  github["GitHub<br/>ryangreenhall/strava-analysis"]

  user -->|"Downloads export"| strava
  user -->|"Runs CLI import"| app
  user -->|"Views dashboards"| app
  strava -->|"Local CSV/GPX files"| app
  app -->|"Stores imported runs"| sqlite
  app -->|"Code pushed to"| github
```

## C4 Level 2: Container View

```mermaid
flowchart TB
  user["Runner / App User"]

  subgraph local["Local Machine"]
    cli["CLI Importer<br/>node src/cli/import-strava-activities-csv.ts"]
    web["HTTP Server<br/>node src/presentation/http/server.ts"]
    domain["Domain + Application Core<br/>activities, stats, use cases, ports"]
    sqliteAdapter["SQLite Adapter<br/>SqliteActivityRepository"]
    gpxCsvAdapter["CSV/GPX Import Adapter<br/>StravaActivitiesCsvReader"]
    views["MVC Views + Controllers<br/>overview, year, month pages"]
    db[("SQLite<br/>runs database")]
    files["Strava Export Files<br/>activities.csv + activities/*.gpx"]
  end

  user -->|"Runs import command"| cli
  user -->|"Opens localhost:5173"| web
  files --> gpxCsvAdapter
  cli --> gpxCsvAdapter
  cli --> domain
  web --> views
  views --> domain
  domain --> sqliteAdapter
  sqliteAdapter --> db
```

## C4 Level 3: Component View

```mermaid
flowchart LR
  subgraph presentation["Presentation Layer"]
    server["server.ts<br/>HTTP routing"]
    overviewController["OverviewController"]
    yearController["YearOverviewController"]
    monthController["MonthOverviewController"]
    overviewView["overview-view.ts"]
    yearView["year-overview-view.ts"]
    monthView["month-overview-view.ts"]
  end

  subgraph application["Application Layer"]
    getOverview["GetRunningOverview"]
    getYear["GetYearRunningOverview"]
    getMonth["GetMonthRunningOverview"]
    importCsv["ImportStravaActivitiesCsv"]
    activityRepoPort["ActivityRepository port"]
  end

  subgraph domain["Domain Layer"]
    activity["Activity model"]
    stats["activity-stats.ts<br/>overview, yearly, monthly calculations"]
    distance["distance.ts<br/>miles + path distance helpers"]
  end

  subgraph infrastructure["Infrastructure Layer"]
    sqliteRepo["SqliteActivityRepository"]
    migrator["SqliteMigrator"]
    csvReader["StravaActivitiesCsvReader"]
    gpxImporter["GpxUrlImporter"]
    sqlite[("SQLite database")]
    exportFiles["Strava export files"]
  end

  server --> overviewController
  server --> yearController
  server --> monthController
  overviewController --> getOverview
  yearController --> getYear
  monthController --> getMonth
  overviewController --> overviewView
  yearController --> yearView
  monthController --> monthView

  getOverview --> activityRepoPort
  getYear --> activityRepoPort
  getMonth --> activityRepoPort
  importCsv --> activityRepoPort
  getOverview --> stats
  getYear --> stats
  getMonth --> stats
  stats --> activity
  stats --> distance

  sqliteRepo -. implements .-> activityRepoPort
  sqliteRepo --> sqlite
  migrator --> sqlite
  csvReader --> exportFiles
  importCsv --> csvReader
  gpxImporter --> activity
```

## Key Architectural Choices

- **Hexagonal style:** application use cases depend on ports, not concrete storage or import mechanisms.
- **Clear domain model:** `Activity` and activity statistics are kept in `src/domain`.
- **MVC web layer:** HTTP controllers select use cases and views render HTML.
- **Database migrations:** SQL migrations live in `migrations/` and are applied by `SqliteMigrator`.
- **CLI import path:** Strava bulk export data is imported through `src/cli/import-strava-activities-csv.ts`.
