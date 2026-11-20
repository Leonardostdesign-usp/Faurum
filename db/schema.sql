-- Schema da plataforma Faurum (libSQL / Turso)
-- Idempotente com CREATE TABLE IF NOT EXISTS e CREATE INDEX IF NOT EXISTS

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nick TEXT NOT NULL UNIQUE COLLATE NOCASE,
  course TEXT NOT NULL CHECK (course IN ('arquitetura', 'design', 'outro')),
  session_token_hash TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  ip TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  privacy_accepted_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S+00:00', 'now'))
);

CREATE TABLE IF NOT EXISTS replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL CHECK (topic_id IN (1, 2)),
  parent_id INTEGER REFERENCES replies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT CHECK (body IS NULL OR length(body) <= 500),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S+00:00', 'now')),
  edited_at TEXT,
  deleted_at TEXT,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1))
);

CREATE TABLE IF NOT EXISTS votes (
  user_id INTEGER NOT NULL REFERENCES users(id),
  reply_id INTEGER NOT NULL REFERENCES replies(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S+00:00', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S+00:00', 'now')),
  PRIMARY KEY (user_id, reply_id)
);

CREATE INDEX IF NOT EXISTS idx_replies_topic_parent_created ON replies(topic_id, parent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_votes_reply ON votes(reply_id);
CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON users(fingerprint);
CREATE INDEX IF NOT EXISTS idx_users_ip ON users(ip);
