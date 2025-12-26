import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema, isSchemaInitialized } from './schema';

describe('schema', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('initSchema', () => {
    it('creates snippets table', () => {
      initSchema(db);

      const tableInfo = db.prepare("PRAGMA table_info('snippets')").all() as {
        name: string;
        type: string;
        notnull: number;
        pk: number;
      }[];

      const columns = tableInfo.map(c => c.name);
      expect(columns).toContain('id');
      expect(columns).toContain('title');
      expect(columns).toContain('content');
      expect(columns).toContain('tags');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('creates snippet_versions table', () => {
      initSchema(db);

      const tableInfo = db.prepare("PRAGMA table_info('snippet_versions')").all() as {
        name: string;
      }[];

      const columns = tableInfo.map(c => c.name);
      expect(columns).toContain('id');
      expect(columns).toContain('snippet_id');
      expect(columns).toContain('title');
      expect(columns).toContain('content');
      expect(columns).toContain('tags');
      expect(columns).toContain('created_at');
    });

    it('creates snippet_embedding_map table', () => {
      initSchema(db);

      const tableInfo = db.prepare("PRAGMA table_info('snippet_embedding_map')").all() as {
        name: string;
      }[];

      const columns = tableInfo.map(c => c.name);
      expect(columns).toContain('snippet_id');
      expect(columns).toContain('rowid');
    });

    it('creates indexes', () => {
      initSchema(db);

      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index'")
        .all() as { name: string }[];

      const indexNames = indexes.map(i => i.name);
      expect(indexNames).toContain('idx_snippets_updated_at');
      expect(indexNames).toContain('idx_versions_snippet_id');
    });

    it('is idempotent', () => {
      initSchema(db);
      initSchema(db);
      initSchema(db);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];

      expect(tables.length).toBeGreaterThan(0);
    });
  });

  describe('isSchemaInitialized', () => {
    it('returns false before init', () => {
      expect(isSchemaInitialized(db)).toBe(false);
    });

    it('returns true after init', () => {
      initSchema(db);
      expect(isSchemaInitialized(db)).toBe(true);
    });
  });
});
