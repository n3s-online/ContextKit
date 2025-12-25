import type Database from 'better-sqlite3';
import type { Snippet, SnippetVersion, CreateSnippetInput, UpdateSnippetInput } from '../types';
import { randomUUID } from 'crypto';
import { deleteEmbedding } from './vectors';
import { SnippetRow, VersionRow, rowToSnippet, rowToVersion } from './rows';

/**
 * Create a new snippet
 */
export function createSnippet(db: Database.Database, input: CreateSnippetInput): Snippet {
  const now = new Date().toISOString();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO snippets (id, title, content, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, input.title, input.content, JSON.stringify(input.tags), now, now);

  return {
    id,
    title: input.title,
    content: input.content,
    tags: input.tags,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get a snippet by ID
 */
export function getSnippet(db: Database.Database, id: string): Snippet | null {
  const row = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id) as SnippetRow | undefined;
  if (!row) return null;
  return rowToSnippet(row);
}

/**
 * Get all snippets, ordered by most recently updated
 */
export function getAllSnippets(db: Database.Database): Snippet[] {
  const rows = db.prepare('SELECT * FROM snippets ORDER BY updated_at DESC').all() as SnippetRow[];
  return rows.map(rowToSnippet);
}

/**
 * Get multiple snippets by IDs (batch query)
 */
export function getSnippetsByIds(db: Database.Database, ids: string[]): Snippet[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT * FROM snippets WHERE id IN (${placeholders})`
  ).all(...ids) as SnippetRow[];
  return rows.map(rowToSnippet);
}

/**
 * Update a snippet (creates version before updating)
 * Uses transaction for atomicity
 */
export function updateSnippet(db: Database.Database, id: string, input: UpdateSnippetInput): Snippet | null {
  const updateTx = db.transaction(() => {
    const row = db.prepare('SELECT * FROM snippets WHERE id = ?').get(id) as SnippetRow | undefined;
    if (!row) return null;

    const existing = rowToSnippet(row);
    const now = new Date().toISOString();

    // Create version before updating
    const versionId = randomUUID();
    db.prepare(`
      INSERT INTO snippet_versions (id, snippet_id, title, content, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(versionId, existing.id, existing.title, existing.content, JSON.stringify(existing.tags), now);

    const title = input.title ?? existing.title;
    const content = input.content ?? existing.content;
    const tags = input.tags ?? existing.tags;

    db.prepare(`
      UPDATE snippets SET title = ?, content = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `).run(title, content, JSON.stringify(tags), now, id);

    return {
      id,
      title,
      content,
      tags,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  });

  return updateTx();
}

/**
 * Delete a snippet and its embedding
 * Uses transaction for atomicity
 * Note: vec0 virtual tables don't participate in FK cascades,
 * so we must delete the embedding before deleting the snippet
 */
export function deleteSnippet(db: Database.Database, id: string): boolean {
  const deleteTx = db.transaction(() => {
    // Delete embedding first - vec0 tables don't cascade with FKs
    deleteEmbedding(db, id);

    const result = db.prepare('DELETE FROM snippets WHERE id = ?').run(id);
    return result.changes > 0;
  });

  return deleteTx();
}

/**
 * Get versions for a snippet
 */
export function getSnippetVersions(db: Database.Database, snippetId: string): SnippetVersion[] {
  const rows = db.prepare(
    'SELECT * FROM snippet_versions WHERE snippet_id = ? ORDER BY created_at DESC'
  ).all(snippetId) as VersionRow[];
  return rows.map(rowToVersion);
}
