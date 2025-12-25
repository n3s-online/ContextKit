import type Database from 'better-sqlite3';

/**
 * Initialize database schema
 */
export function initSchema(db: Database.Database): void {
  db.exec(`
    -- Snippets table
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Snippet versions for history
    CREATE TABLE IF NOT EXISTS snippet_versions (
      id TEXT PRIMARY KEY,
      snippet_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
    );

    -- Mapping table for snippet <-> embedding
    CREATE TABLE IF NOT EXISTS snippet_embedding_map (
      snippet_id TEXT PRIMARY KEY,
      rowid INTEGER NOT NULL,
      FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_snippets_updated_at ON snippets(updated_at);
    CREATE INDEX IF NOT EXISTS idx_versions_snippet_id ON snippet_versions(snippet_id);
  `);
}

/**
 * Check if schema is initialized
 */
export function isSchemaInitialized(db: Database.Database): boolean {
  const result = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='snippets'"
  ).get();
  return result !== undefined;
}
