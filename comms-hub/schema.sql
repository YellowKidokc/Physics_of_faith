CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_name TEXT NOT NULL,
  to_name TEXT,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_by TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
