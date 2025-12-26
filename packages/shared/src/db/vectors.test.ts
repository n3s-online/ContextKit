import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getTestDb } from './client';
import { upsertEmbedding, searchSimilar, deleteEmbedding } from './vectors';
import type Database from 'better-sqlite3';

describe('vectors', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = getTestDb();
  });

  afterEach(() => {
    db.close();
  });

  // Create a 384-dimensional normalized vector for testing
  function createTestVector(seed: number): number[] {
    const vec = Array.from({ length: 384 }, (_, i) => Math.sin(seed + i));
    // Normalize
    const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return vec.map(v => v / magnitude);
  }

  describe('upsertEmbedding', () => {
    it('inserts new embedding', () => {
      const embedding = createTestVector(1);
      db.prepare("INSERT INTO snippets VALUES ('s1', 'Test', 'Content', '[]', '2024-01-01', '2024-01-01')").run();

      upsertEmbedding(db, 's1', embedding);

      const mapping = db.prepare('SELECT * FROM snippet_embedding_map WHERE snippet_id = ?').get('s1');
      expect(mapping).toBeDefined();
    });

    it('updates existing embedding', () => {
      const embedding1 = createTestVector(1);
      const embedding2 = createTestVector(2);
      db.prepare("INSERT INTO snippets VALUES ('s1', 'Test', 'Content', '[]', '2024-01-01', '2024-01-01')").run();

      upsertEmbedding(db, 's1', embedding1);
      upsertEmbedding(db, 's1', embedding2);

      // Should still have only one mapping
      const count = db.prepare('SELECT COUNT(*) as count FROM snippet_embedding_map WHERE snippet_id = ?').get('s1') as { count: number };
      expect(count.count).toBe(1);
    });
  });

  describe('searchSimilar', () => {
    beforeEach(() => {
      // Insert test snippets
      db.prepare("INSERT INTO snippets VALUES ('s1', 'Test 1', 'Content 1', '[]', '2024-01-01', '2024-01-01')").run();
      db.prepare("INSERT INTO snippets VALUES ('s2', 'Test 2', 'Content 2', '[]', '2024-01-01', '2024-01-01')").run();
      db.prepare("INSERT INTO snippets VALUES ('s3', 'Test 3', 'Content 3', '[]', '2024-01-01', '2024-01-01')").run();

      // Insert embeddings
      upsertEmbedding(db, 's1', createTestVector(1));
      upsertEmbedding(db, 's2', createTestVector(2));
      upsertEmbedding(db, 's3', createTestVector(100)); // Very different
    });

    it('returns results sorted by distance', () => {
      const queryVec = createTestVector(1.5); // Closer to s1 and s2
      const results = searchSimilar(db, queryVec, 10);

      expect(results.length).toBe(3);
      // Results should be sorted by distance (ascending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distance).toBeGreaterThanOrEqual(results[i - 1].distance);
      }
    });

    it('respects limit parameter', () => {
      const queryVec = createTestVector(1);
      const results = searchSimilar(db, queryVec, 2);

      expect(results.length).toBe(2);
    });

    it('returns empty for no embeddings', () => {
      const emptyDb = getTestDb();
      const queryVec = createTestVector(1);
      const results = searchSimilar(emptyDb, queryVec, 10);

      expect(results).toEqual([]);
      emptyDb.close();
    });

    it('returns snippetId and distance', () => {
      const queryVec = createTestVector(1);
      const results = searchSimilar(db, queryVec, 1);

      expect(results[0]).toHaveProperty('snippetId');
      expect(results[0]).toHaveProperty('distance');
      expect(typeof results[0].distance).toBe('number');
    });
  });

  describe('deleteEmbedding', () => {
    it('removes embedding and mapping', () => {
      const embedding = createTestVector(1);
      db.prepare("INSERT INTO snippets VALUES ('s1', 'Test', 'Content', '[]', '2024-01-01', '2024-01-01')").run();
      upsertEmbedding(db, 's1', embedding);

      deleteEmbedding(db, 's1');

      const mapping = db.prepare('SELECT * FROM snippet_embedding_map WHERE snippet_id = ?').get('s1');
      expect(mapping).toBeUndefined();
    });

    it('handles non-existent embedding gracefully', () => {
      expect(() => deleteEmbedding(db, 'nonexistent')).not.toThrow();
    });
  });
});
