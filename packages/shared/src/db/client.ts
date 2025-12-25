import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { initSchema } from './schema';
import { loadVecExtension, initVectorTable } from './vectors';

/**
 * Get the platform-specific database directory
 */
export function getDbPath(): string {
  const platform = os.platform();
  let baseDir: string;

  switch (platform) {
    case 'darwin':
      baseDir = path.join(os.homedir(), 'Library', 'Application Support', 'contextkit');
      break;
    case 'win32':
      baseDir = path.join(process.env.APPDATA || os.homedir(), 'contextkit');
      break;
    default:
      baseDir = path.join(os.homedir(), '.local', 'share', 'contextkit');
  }

  fs.mkdirSync(baseDir, { recursive: true });
  return path.join(baseDir, 'contextkit.db');
}

let db: Database.Database | null = null;

/**
 * Get or create the database connection (with schema initialized)
 */
export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    loadVecExtension(db);
    initSchema(db);
    initVectorTable(db);
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * For testing: create in-memory database (with schema)
 */
export function getTestDb(): Database.Database {
  const testDb = new Database(':memory:');
  loadVecExtension(testDb);
  initSchema(testDb);
  initVectorTable(testDb);
  return testDb;
}

/**
 * For testing: reset the singleton connection
 */
export function resetDb(): void {
  closeDb();
}

/**
 * For testing: set a custom database instance
 */
export function setDb(database: Database.Database): void {
  if (db) {
    db.close();
  }
  db = database;
}
