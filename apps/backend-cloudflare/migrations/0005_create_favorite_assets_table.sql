CREATE TABLE IF NOT EXISTS favorite_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  label TEXT NOT NULL,
  market TEXT,
  currency TEXT,
  logo_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, symbol, asset_type)
);

CREATE INDEX IF NOT EXISTS idx_favorite_assets_user_created_at
  ON favorite_assets (user_id, created_at DESC);
