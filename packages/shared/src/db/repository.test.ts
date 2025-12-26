import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getTestDb } from './client';
import {
  createSnippet,
  getSnippet,
  getAllSnippets,
  getSnippetsByIds,
  updateSnippet,
  deleteSnippet,
  getSnippetVersions,
} from './repository';
import type Database from 'better-sqlite3';

describe('repository', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = getTestDb();
  });

  afterEach(() => {
    db.close();
  });

  describe('createSnippet', () => {
    it('creates snippet with generated id', () => {
      const snippet = createSnippet(db, {
        title: 'Test Snippet',
        content: 'Test content',
        tags: ['test', 'example'],
      });

      expect(snippet.id).toBeDefined();
      expect(snippet.id.length).toBe(36); // UUID
      expect(snippet.title).toBe('Test Snippet');
      expect(snippet.content).toBe('Test content');
      expect(snippet.tags).toEqual(['test', 'example']);
    });

    it('sets createdAt and updatedAt', () => {
      const before = new Date().toISOString();
      const snippet = createSnippet(db, {
        title: 'Test',
        content: 'Content',
        tags: [],
      });
      const after = new Date().toISOString();

      expect(snippet.createdAt >= before).toBe(true);
      expect(snippet.createdAt <= after).toBe(true);
      expect(snippet.updatedAt).toBe(snippet.createdAt);
    });

    it('persists to database', () => {
      const created = createSnippet(db, {
        title: 'Test',
        content: 'Content',
        tags: ['tag1'],
      });

      const fetched = getSnippet(db, created.id);
      expect(fetched).toEqual(created);
    });
  });

  describe('getSnippet', () => {
    it('returns null for non-existent id', () => {
      const result = getSnippet(db, 'nonexistent');
      expect(result).toBeNull();
    });

    it('returns snippet with parsed tags', () => {
      const created = createSnippet(db, {
        title: 'Test',
        content: 'Content',
        tags: ['a', 'b', 'c'],
      });

      const fetched = getSnippet(db, created.id);
      expect(fetched?.tags).toEqual(['a', 'b', 'c']);
    });
  });

  describe('getAllSnippets', () => {
    it('returns empty array when no snippets', () => {
      const result = getAllSnippets(db);
      expect(result).toEqual([]);
    });

    it('returns snippets ordered by updated_at desc', () => {
      // Insert with explicit timestamps to avoid timing flakiness
      db.prepare(`
        INSERT INTO snippets (id, title, content, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('s1', 'First', 'C1', '[]', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');
      db.prepare(`
        INSERT INTO snippets (id, title, content, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('s2', 'Second', 'C2', '[]', '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z');
      db.prepare(`
        INSERT INTO snippets (id, title, content, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('s3', 'Third', 'C3', '[]', '2024-01-03T00:00:00Z', '2024-01-03T00:00:00Z');

      const all = getAllSnippets(db);
      expect(all.length).toBe(3);
      expect(all[0].id).toBe('s3'); // Most recent first
      expect(all[1].id).toBe('s2');
      expect(all[2].id).toBe('s1');
    });
  });

  describe('getSnippetsByIds', () => {
    it('returns empty array for empty ids', () => {
      const result = getSnippetsByIds(db, []);
      expect(result).toEqual([]);
    });

    it('returns matching snippets', () => {
      const s1 = createSnippet(db, { title: 'One', content: 'C1', tags: [] });
      const s2 = createSnippet(db, { title: 'Two', content: 'C2', tags: [] });
      createSnippet(db, { title: 'Three', content: 'C3', tags: [] });

      const result = getSnippetsByIds(db, [s1.id, s2.id]);
      expect(result.length).toBe(2);
      expect(result.map(s => s.id)).toContain(s1.id);
      expect(result.map(s => s.id)).toContain(s2.id);
    });

    it('ignores non-existent ids', () => {
      const s1 = createSnippet(db, { title: 'One', content: 'C1', tags: [] });
      const result = getSnippetsByIds(db, [s1.id, 'nonexistent']);
      expect(result.length).toBe(1);
    });
  });

  describe('updateSnippet', () => {
    it('returns null for non-existent id', () => {
      const result = updateSnippet(db, 'nonexistent', { title: 'New Title' });
      expect(result).toBeNull();
    });

    it('updates only provided fields', () => {
      const created = createSnippet(db, {
        title: 'Original',
        content: 'Original content',
        tags: ['original'],
      });

      const updated = updateSnippet(db, created.id, { title: 'Updated' });
      expect(updated?.title).toBe('Updated');
      expect(updated?.content).toBe('Original content');
      expect(updated?.tags).toEqual(['original']);
    });

    it('updates updatedAt timestamp', () => {
      const created = createSnippet(db, {
        title: 'Test',
        content: 'Content',
        tags: [],
      });

      const updated = updateSnippet(db, created.id, { title: 'Updated' });

      expect(updated).not.toBeNull();
      // updatedAt should be >= createdAt (may be equal if same millisecond)
      expect(updated!.updatedAt >= created.updatedAt).toBe(true);
      expect(updated!.createdAt).toBe(created.createdAt);
    });

    it('creates version before updating', () => {
      const created = createSnippet(db, {
        title: 'Original',
        content: 'Original content',
        tags: ['v1'],
      });

      updateSnippet(db, created.id, { title: 'Updated' });

      const versions = getSnippetVersions(db, created.id);
      expect(versions.length).toBe(1);
      expect(versions[0].title).toBe('Original');
      expect(versions[0].content).toBe('Original content');
      expect(versions[0].tags).toEqual(['v1']);
    });
  });

  describe('deleteSnippet', () => {
    it('returns false for non-existent id', () => {
      const result = deleteSnippet(db, 'nonexistent');
      expect(result).toBe(false);
    });

    it('removes snippet from database', () => {
      const created = createSnippet(db, {
        title: 'Test',
        content: 'Content',
        tags: [],
      });

      const result = deleteSnippet(db, created.id);
      expect(result).toBe(true);

      const fetched = getSnippet(db, created.id);
      expect(fetched).toBeNull();
    });

    it('cascades to versions', () => {
      const created = createSnippet(db, {
        title: 'Original',
        content: 'Content',
        tags: [],
      });
      updateSnippet(db, created.id, { title: 'Updated' });

      deleteSnippet(db, created.id);

      const versions = getSnippetVersions(db, created.id);
      expect(versions).toEqual([]);
    });
  });

  describe('getSnippetVersions', () => {
    it('returns empty array when no versions', () => {
      const created = createSnippet(db, {
        title: 'Test',
        content: 'Content',
        tags: [],
      });

      const versions = getSnippetVersions(db, created.id);
      expect(versions).toEqual([]);
    });

    it('returns versions in descending order', () => {
      // Insert snippet with explicit timestamp
      db.prepare(`
        INSERT INTO snippets (id, title, content, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('test-id', 'V1', 'Content 1', '[]', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');

      // Insert versions with explicit timestamps
      db.prepare(`
        INSERT INTO snippet_versions (id, snippet_id, title, content, tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('v1', 'test-id', 'V1', 'Content 1', '[]', '2024-01-01T00:00:00Z');
      db.prepare(`
        INSERT INTO snippet_versions (id, snippet_id, title, content, tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('v2', 'test-id', 'V2', 'Content 2', '[]', '2024-01-02T00:00:00Z');

      const versions = getSnippetVersions(db, 'test-id');
      expect(versions.length).toBe(2);
      expect(versions[0].title).toBe('V2'); // Most recent first
      expect(versions[1].title).toBe('V1');
    });
  });
});
