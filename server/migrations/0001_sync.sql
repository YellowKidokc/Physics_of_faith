-- POF 2828 — D1 sync schema
-- One row per entity. The (rev, updated_at) pair drives sync:
--   * `rev` is a per-table monotonic counter assigned on the server
--     (see worker — MAX(rev)+1 inside a transaction; D1 serializes
--     writes per database so this is race-free).
--   * `updated_at` is client wall time at edit (ms epoch). It's the
--     conflict tiebreaker for last-write-wins tables.
--   * `deleted=1` rows are tombstones; cron purges old ones.

CREATE TABLE devices (
  device_id  TEXT    PRIMARY KEY,
  token_hash TEXT    NOT NULL UNIQUE,           -- sha256(raw_token), lowercase hex
  label      TEXT,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER,
  revoked    INTEGER NOT NULL DEFAULT 0
);

-- Clipboard entries — last-write-wins by updated_at.
CREATE TABLE clips (
  id         TEXT    PRIMARY KEY,
  device_id  TEXT    NOT NULL,
  body       TEXT    NOT NULL,                  -- JSON: {content, tags, slot, pinned, ...}
  updated_at INTEGER NOT NULL,
  rev        INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_clips_rev ON clips(rev);

-- Notes — 3-way merge by base_rev (see worker/src/merge.ts).
CREATE TABLE notes (
  id         TEXT    PRIMARY KEY,
  device_id  TEXT    NOT NULL,
  title      TEXT,
  body       TEXT    NOT NULL,
  base_rev   INTEGER,                            -- rev the client last saw before editing
  updated_at INTEGER NOT NULL,
  rev        INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_notes_rev ON notes(rev);

-- Bookmarks — LWW.
CREATE TABLE bookmarks (
  id         TEXT    PRIMARY KEY,
  device_id  TEXT    NOT NULL,
  body       TEXT    NOT NULL,                  -- JSON: {url, title, description, tags, category}
  updated_at INTEGER NOT NULL,
  rev        INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_bookmarks_rev ON bookmarks(rev);

-- Prompts — LWW.
CREATE TABLE prompts (
  id         TEXT    PRIMARY KEY,
  device_id  TEXT    NOT NULL,
  body       TEXT    NOT NULL,                  -- JSON: {name, short, template, category, ...}
  updated_at INTEGER NOT NULL,
  rev        INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_prompts_rev ON prompts(rev);

-- Tasks — LWW.
CREATE TABLE tasks (
  id         TEXT    PRIMARY KEY,
  device_id  TEXT    NOT NULL,
  body       TEXT    NOT NULL,                  -- JSON: {title, due, time, done, priority, project, notes}
  updated_at INTEGER NOT NULL,
  rev        INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_tasks_rev ON tasks(rev);
