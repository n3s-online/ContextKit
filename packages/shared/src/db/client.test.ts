import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import { getDbPath, getTestDb, closeDb, resetDb } from './client';

describe('client', () => {
  afterEach(() => {
    resetDb();
  });

  describe('getDbPath', () => {
    it('returns platform-specific path', () => {
      const dbPath = getDbPath();
      expect(dbPath).toContain('contextkit.db');

      const platform = os.platform();
      if (platform === 'darwin') {
        expect(dbPath).toContain('Library/Application Support/contextkit');
      } else if (platform === 'win32') {
        expect(dbPath).toContain('contextkit');
      } else {
        expect(dbPath).toContain('.local/share/contextkit');
      }
    });

    it('path is absolute', () => {
      const dbPath = getDbPath();
      expect(path.isAbsolute(dbPath)).toBe(true);
    });
  });

  describe('getTestDb', () => {
    it('returns in-memory database', () => {
      const db = getTestDb();
      expect(db).toBeDefined();
      expect(db.open).toBe(true);
      db.close();
    });

    it('has schema initialized', () => {
      const db = getTestDb();
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('snippets');
      expect(tableNames).toContain('snippet_versions');
      expect(tableNames).toContain('snippet_embedding_map');

      db.close();
    });

    it('has vector table initialized', () => {
      const db = getTestDb();
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('snippet_embeddings');

      db.close();
    });

    it('each call returns fresh database', () => {
      const db1 = getTestDb();
      db1.prepare("INSERT INTO snippets VALUES ('1', 'Test', 'Content', '[]', '2024-01-01', '2024-01-01')").run();

      const db2 = getTestDb();
      const count = db2.prepare('SELECT COUNT(*) as count FROM snippets').get() as { count: number };
      expect(count.count).toBe(0);

      db1.close();
      db2.close();
    });
  });
});
