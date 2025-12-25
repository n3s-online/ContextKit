import type Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

/**
 * Load the sqlite-vec extension
 */
export function loadVecExtension(db: Database.Database): void {
  sqliteVec.load(db);
}

/**
 * Initialize the vector search virtual table
 * all-MiniLM-L6-v2 produces 384-dimensional vectors
 */
export function initVectorTable(db: Database.Database): void {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS snippet_embeddings USING vec0(
      embedding float[384]
    );
  `);
}

/**
 * Insert or update an embedding for a snippet
 * Uses transaction for atomicity
 */
export function upsertEmbedding(
  db: Database.Database,
  snippetId: string,
  embedding: number[]
): void {
  const upsertTx = db.transaction(() => {
    const existing = db.prepare(
      'SELECT rowid FROM snippet_embedding_map WHERE snippet_id = ?'
    ).get(snippetId) as { rowid: number } | undefined;

    const vecBuffer = new Float32Array(embedding).buffer;

    if (existing) {
      db.prepare(
        'UPDATE snippet_embeddings SET embedding = ? WHERE rowid = ?'
      ).run(vecBuffer, existing.rowid);
    } else {
      const result = db.prepare(
        'INSERT INTO snippet_embeddings(embedding) VALUES (?)'
      ).run(vecBuffer);

      db.prepare(
        'INSERT INTO snippet_embedding_map(snippet_id, rowid) VALUES (?, ?)'
      ).run(snippetId, result.lastInsertRowid);
    }
  });

  upsertTx();
}

/**
 * Search for similar snippets by embedding
 * Returns snippetIds sorted by similarity (closest first)
 */
export function searchSimilar(
  db: Database.Database,
  queryEmbedding: number[],
  limit: number = 10
): Array<{ snippetId: string; distance: number }> {
  const vecBuffer = new Float32Array(queryEmbedding).buffer;

  const results = db.prepare(`
    SELECT
      m.snippet_id,
      e.distance
    FROM snippet_embeddings e
    JOIN snippet_embedding_map m ON m.rowid = e.rowid
    WHERE e.embedding MATCH ?
    ORDER BY e.distance
    LIMIT ?
  `).all(vecBuffer, limit) as Array<{
    snippet_id: string;
    distance: number;
  }>;

  return results.map(r => ({
    snippetId: r.snippet_id,
    distance: r.distance
  }));
}

/**
 * Delete embedding for a snippet
 * Uses transaction for atomicity
 * Note: vec0 virtual tables don't participate in FK cascades,
 * so this must be called before deleting the snippet
 */
export function deleteEmbedding(db: Database.Database, snippetId: string): void {
  const deleteTx = db.transaction(() => {
    const mapping = db.prepare(
      'SELECT rowid FROM snippet_embedding_map WHERE snippet_id = ?'
    ).get(snippetId) as { rowid: number } | undefined;

    if (mapping) {
      db.prepare('DELETE FROM snippet_embeddings WHERE rowid = ?').run(mapping.rowid);
      db.prepare('DELETE FROM snippet_embedding_map WHERE snippet_id = ?').run(snippetId);
    }
  });

  deleteTx();
}
