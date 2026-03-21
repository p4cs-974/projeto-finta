CREATE TABLE IF NOT EXISTS user_activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  symbol TEXT,
  asset_type TEXT,
  label TEXT,
  search_query TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_activity_events_user_created_at
  ON user_activity_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_events_user_type_created_at
  ON user_activity_events (user_id, event_type, created_at DESC);
