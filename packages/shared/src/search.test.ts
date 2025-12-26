import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { getTestDb } from './db/client';
import { createSnippet } from './db/repository';
import { searchSnippets, updateSnippetEmbedding } from './search';
import { preloadModel } from './embeddings';
import type Database from 'better-sqlite3';

describe('search', () => {
  let db: Database.Database;

  beforeAll(async () => {
    await preloadModel();
  }, 60000);

  beforeEach(() => {
    db = getTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe('searchSnippets', () => {
    it('returns empty array for no snippets', async () => {
      const results = await searchSnippets(db, 'test query');
      expect(results).toEqual([]);
    });

    it('returns results with snippet and score', async () => {
      const snippet = createSnippet(db, {
        title: 'TypeScript Tutorial',
        content: 'Learn TypeScript programming',
        tags: ['typescript', 'tutorial'],
      });
      await updateSnippetEmbedding(db, snippet);

      const results = await searchSnippets(db, 'typescript programming');
      expect(results.length).toBe(1);
      expect(results[0].snippet.id).toBe(snippet.id);
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].score).toBeLessThanOrEqual(1);
    });

    it('returns results sorted by score descending', async () => {
      // Create snippets with varying relevance
      const s1 = createSnippet(db, {
        title: 'Python Guide',
        content: 'Learn Python programming language',
        tags: ['python'],
      });
      const s2 = createSnippet(db, {
        title: 'TypeScript Tutorial',
        content: 'TypeScript is a typed superset of JavaScript',
        tags: ['typescript', 'javascript'],
      });
      const s3 = createSnippet(db, {
        title: 'Cooking Recipes',
        content: 'How to make pasta',
        tags: ['cooking'],
      });

      await Promise.all([
        updateSnippetEmbedding(db, s1),
        updateSnippetEmbedding(db, s2),
        updateSnippetEmbedding(db, s3),
      ]);

      const results = await searchSnippets(db, 'typescript javascript programming');

      expect(results.length).toBe(3);
      // Scores should be descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
      }
      // TypeScript should be most relevant
      expect(results[0].snippet.id).toBe(s2.id);
    });

    it('respects limit parameter', async () => {
      // Create multiple snippets
      for (let i = 0; i < 5; i++) {
        const snippet = createSnippet(db, {
          title: `Snippet ${i}`,
          content: `Programming content ${i}`,
          tags: [],
        });
        await updateSnippetEmbedding(db, snippet);
      }

      const results = await searchSnippets(db, 'programming', 2);
      expect(results.length).toBe(2);
    });

    it('score is between 0 and 1', async () => {
      const snippet = createSnippet(db, {
        title: 'Test',
        content: 'Test content',
        tags: [],
      });
      await updateSnippetEmbedding(db, snippet);

      const results = await searchSnippets(db, 'random query');
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].score).toBeLessThanOrEqual(1);
    });
  });

  describe('updateSnippetEmbedding', () => {
    it('creates embedding for new snippet', async () => {
      const snippet = createSnippet(db, {
        title: 'New Snippet',
        content: 'Content here',
        tags: ['new'],
      });

      await updateSnippetEmbedding(db, snippet);

      // Verify embedding exists by searching
      const results = await searchSnippets(db, 'new snippet');
      expect(results.length).toBe(1);
    });

    it('updates embedding for modified snippet', async () => {
      const snippet = createSnippet(db, {
        title: 'Original',
        content: 'Original content',
        tags: [],
      });
      await updateSnippetEmbedding(db, snippet);

      // Update the snippet
      const updatedSnippet = {
        ...snippet,
        title: 'Updated TypeScript',
        content: 'TypeScript programming guide',
      };
      await updateSnippetEmbedding(db, updatedSnippet);

      // Search should now match TypeScript
      const results = await searchSnippets(db, 'typescript');
      expect(results.length).toBe(1);
      // Should have higher relevance for TypeScript query
      expect(results[0].score).toBeGreaterThan(0.3);
    });
  });
});
