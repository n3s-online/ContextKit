import { getDb as getDbBase, seedBuiltins, areBuiltinsSeeded, type BuiltinSnippet } from '@contextkit/shared';
import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

/**
 * Load builtin snippets from bundled JSON
 */
function loadBuiltinSnippets(): BuiltinSnippet[] {
  const snippetsPath = path.join(__dirname, '../builtin/snippets.json');
  if (!fs.existsSync(snippetsPath)) {
    console.warn('Warning: builtin snippets not found at', snippetsPath);
    return [];
  }
  return JSON.parse(fs.readFileSync(snippetsPath, 'utf-8'));
}

/**
 * Get database with builtin snippets seeded
 * Wraps shared getDb() with automatic seeding on first access
 */
export function getDb(): Database.Database {
  const db = getDbBase();

  if (!areBuiltinsSeeded(db)) {
    const snippets = loadBuiltinSnippets();
    if (snippets.length > 0) {
      seedBuiltins(db, snippets);
    }
  }

  return db;
}
