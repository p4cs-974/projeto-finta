CREATE TABLE recent_asset_selections (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	symbol TEXT NOT NULL,
	asset_type TEXT NOT NULL,
	label TEXT NOT NULL,
	market TEXT,
	currency TEXT,
	last_selected_at TEXT NOT NULL,
	UNIQUE(user_id, symbol, asset_type),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_recent_asset_selections_user_recent
	ON recent_asset_selections(user_id, last_selected_at DESC);
