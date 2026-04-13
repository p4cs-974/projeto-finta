-- Migration number: 0007 	 2026-04-12T00:00:00.000Z
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id INTEGER NOT NULL,
    key_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_key_hash_unique_idx ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS api_keys_user_id_created_at_idx ON api_keys(user_id, created_at DESC);
