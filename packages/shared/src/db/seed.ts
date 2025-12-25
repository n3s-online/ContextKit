import type Database from 'better-sqlite3';
import { upsertEmbedding } from './vectors';

/**
 * Builtin snippet with pre-computed embedding
 */
export interface BuiltinSnippet {
  id: string;
  title: string;
  content: string;
  tags: string[];
  embedding: number[];
}

/**
 * Check if builtins are already seeded
 * Uses specific ID check for deterministic behavior
 */
export function areBuiltinsSeeded(db: Database.Database): boolean {
  const row = db.prepare(
    'SELECT 1 FROM snippets WHERE id = ?'
  ).get('builtin-nextjs');
  return !!row;
}

/**
 * Seed builtin snippets into database
 * Idempotent - skips if already seeded
 * Uses transaction for atomicity
 */
export function seedBuiltins(db: Database.Database, snippets: BuiltinSnippet[]): number {
  if (areBuiltinsSeeded(db)) {
    return 0;
  }

  const now = new Date().toISOString();

  const seedTx = db.transaction(() => {
    for (const snippet of snippets) {
      // Insert snippet
      db.prepare(`
        INSERT INTO snippets (id, title, content, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        snippet.id,
        snippet.title,
        snippet.content,
        JSON.stringify(snippet.tags),
        now,
        now
      );

      // Insert pre-computed embedding
      upsertEmbedding(db, snippet.id, snippet.embedding);
    }
    return snippets.length;
  });

  return seedTx();
}
