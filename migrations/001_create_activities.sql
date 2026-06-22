CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  location TEXT NOT NULL,
  start_lat REAL,
  start_lon REAL,
  end_lat REAL,
  end_lon REAL,
  distance_meters REAL NOT NULL,
  moving_seconds INTEGER NOT NULL,
  elevation_gain_meters REAL NOT NULL,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
