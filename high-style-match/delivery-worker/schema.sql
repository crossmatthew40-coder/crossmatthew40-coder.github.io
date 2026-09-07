CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploading',
  expires_at TEXT,
  password_salt TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  viewed_at TEXT,
  download_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS delivery_files (
  id TEXT PRIMARY KEY,
  delivery_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS delivery_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  file_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS delivery_files_delivery_idx ON delivery_files(delivery_id);
CREATE INDEX IF NOT EXISTS delivery_events_delivery_idx ON delivery_events(delivery_id, created_at);
