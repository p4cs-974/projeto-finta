CREATE TABLE favorite_assets (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	symbol TEXT NOT NULL,
	asset_type TEXT NOT NULL,
	label TEXT NOT NULL,
	market TEXT,
	currency TEXT,
	logo_url TEXT,
	favorited_at TEXT NOT NULL,
	UNIQUE(user_id, symbol, asset_type),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_favorite_assets_user_recent
	ON favorite_assets(user_id, favorited_at DESC, id DESC);
