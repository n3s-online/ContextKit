import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  hasConfigDir,
  loadConfig,
  loadOrCreateConfig,
  saveConfig,
  addSelectedSnippets,
  removeSelectedSnippets,
  getSelectedSnippets,
} from './config';

describe('config', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `contextkit-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('hasConfigDir', () => {
    it('returns false when .contextkit does not exist', () => {
      expect(hasConfigDir(testDir)).toBe(false);
    });

    it('returns true when .contextkit exists', () => {
      mkdirSync(join(testDir, '.contextkit'));
      expect(hasConfigDir(testDir)).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('returns null when config does not exist', () => {
      expect(loadConfig(testDir)).toBeNull();
    });

    it('returns config when it exists', () => {
      const configDir = join(testDir, '.contextkit');
      mkdirSync(configDir);
      const config = { version: 1, selectedSnippets: [] };
      writeFileSync(join(configDir, 'config.json'), JSON.stringify(config));

      const loaded = loadConfig(testDir);
      expect(loaded).toEqual(config);
    });

    it('throws on invalid JSON', () => {
      const configDir = join(testDir, '.contextkit');
      mkdirSync(configDir);
      writeFileSync(join(configDir, 'config.json'), 'invalid json');

      expect(() => loadConfig(testDir)).toThrow();
    });
  });

  describe('loadOrCreateConfig', () => {
    it('creates default config if none exists', () => {
      const config = loadOrCreateConfig(testDir);

      expect(config.version).toBe(1);
      expect(config.selectedSnippets).toEqual([]);
      expect(existsSync(join(testDir, '.contextkit', 'config.json'))).toBe(true);
    });

    it('returns existing config', () => {
      const existing = { version: 1, selectedSnippets: [{ id: 'test', title: 'Test', selectedAt: '2024-01-01' }] };
      const configDir = join(testDir, '.contextkit');
      mkdirSync(configDir);
      writeFileSync(join(configDir, 'config.json'), JSON.stringify(existing));

      const loaded = loadOrCreateConfig(testDir);
      expect(loaded).toEqual(existing);
    });
  });

  describe('saveConfig', () => {
    it('creates .contextkit directory if missing', () => {
      const config = { version: 1 as const, selectedSnippets: [] };
      saveConfig(config, testDir);

      expect(existsSync(join(testDir, '.contextkit'))).toBe(true);
    });

    it('saves config atomically', () => {
      const config = { version: 1 as const, selectedSnippets: [{ id: 'a', title: 'A', selectedAt: '2024-01-01' }] };
      saveConfig(config, testDir);

      const loaded = loadConfig(testDir);
      expect(loaded).toEqual(config);
    });
  });

  describe('addSelectedSnippets', () => {
    it('adds new snippets', () => {
      const snippet = { id: 'test-123', title: 'Test Snippet', selectedAt: '2024-01-01' };
      const result = addSelectedSnippets([snippet], testDir);

      expect(result.selectedSnippets).toContainEqual(snippet);
    });

    it('skips duplicates', () => {
      const snippet = { id: 'test-123', title: 'Test Snippet', selectedAt: '2024-01-01' };
      addSelectedSnippets([snippet], testDir);
      const result = addSelectedSnippets([snippet], testDir);

      expect(result.selectedSnippets.length).toBe(1);
    });

    it('preserves existing snippets', () => {
      const s1 = { id: 'a', title: 'A', selectedAt: '2024-01-01' };
      const s2 = { id: 'b', title: 'B', selectedAt: '2024-01-02' };

      addSelectedSnippets([s1], testDir);
      const result = addSelectedSnippets([s2], testDir);

      expect(result.selectedSnippets.length).toBe(2);
      expect(result.selectedSnippets.map(s => s.id)).toContain('a');
      expect(result.selectedSnippets.map(s => s.id)).toContain('b');
    });
  });

  describe('removeSelectedSnippets', () => {
    it('removes specified snippets', () => {
      const s1 = { id: 'a', title: 'A', selectedAt: '2024-01-01' };
      const s2 = { id: 'b', title: 'B', selectedAt: '2024-01-02' };
      addSelectedSnippets([s1, s2], testDir);

      const result = removeSelectedSnippets(['a'], testDir);

      expect(result.selectedSnippets.length).toBe(1);
      expect(result.selectedSnippets[0].id).toBe('b');
    });

    it('handles non-existent IDs gracefully', () => {
      const s1 = { id: 'a', title: 'A', selectedAt: '2024-01-01' };
      addSelectedSnippets([s1], testDir);

      const result = removeSelectedSnippets(['nonexistent'], testDir);

      expect(result.selectedSnippets.length).toBe(1);
    });
  });

  describe('getSelectedSnippets', () => {
    it('returns empty array for new project', () => {
      const result = getSelectedSnippets(testDir);
      expect(result).toEqual([]);
    });

    it('returns selected snippets', () => {
      const s1 = { id: 'a', title: 'A', selectedAt: '2024-01-01' };
      addSelectedSnippets([s1], testDir);

      const result = getSelectedSnippets(testDir);
      expect(result).toEqual([s1]);
    });
  });
});
