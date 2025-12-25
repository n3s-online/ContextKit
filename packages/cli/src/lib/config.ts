import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { ProjectConfig, SelectedSnippet } from '@contextkit/shared';

const CONFIG_DIR = '.contextkit';
const CONFIG_FILE = 'config.json';

function getConfigPath(cwd = process.cwd()): string {
  return join(cwd, CONFIG_DIR, CONFIG_FILE);
}

function getConfigDir(cwd = process.cwd()): string {
  return join(cwd, CONFIG_DIR);
}

function defaultConfig(): ProjectConfig {
  return {
    version: 1,
    selectedSnippets: [],
  };
}

/** Check if .contextkit directory exists */
export function hasConfigDir(cwd = process.cwd()): boolean {
  return existsSync(getConfigDir(cwd));
}

/** Load project config. Returns null if doesn't exist. */
export function loadConfig(cwd = process.cwd()): ProjectConfig | null {
  const configPath = getConfigPath(cwd);

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const raw = readFileSync(configPath, 'utf-8');
    return JSON.parse(raw) as ProjectConfig;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to parse ${configPath}: ${msg}`);
  }
}

/** Load config or create default if doesn't exist */
export function loadOrCreateConfig(cwd = process.cwd()): ProjectConfig {
  const existing = loadConfig(cwd);
  if (existing) return existing;

  const config = defaultConfig();
  saveConfig(config, cwd);
  return config;
}

/** Save config atomically (write temp + rename) */
export function saveConfig(config: ProjectConfig, cwd = process.cwd()): void {
  const configPath = getConfigPath(cwd);
  const configDir = getConfigDir(cwd);

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  // Use unique temp path to avoid race conditions
  const tempPath = `${configPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeFileSync(tempPath, JSON.stringify(config, null, 2) + '\n');
    renameSync(tempPath, configPath);
  } catch (err) {
    // Clean up temp file on error
    try {
      unlinkSync(tempPath);
    } catch (cleanupErr) {
      // Log cleanup failure but don't mask original error
      if (process.env.DEBUG) {
        console.error(`Failed to cleanup temp file ${tempPath}:`, cleanupErr);
      }
    }
    throw err;
  }
}

/** Get list of selected snippets */
export function getSelectedSnippets(cwd = process.cwd()): SelectedSnippet[] {
  const config = loadOrCreateConfig(cwd);
  return config.selectedSnippets;
}

/** Add snippets to selection. Returns updated config. */
export function addSelectedSnippets(
  snippets: SelectedSnippet[],
  cwd = process.cwd()
): ProjectConfig {
  const config = loadOrCreateConfig(cwd);
  const existingIds = new Set(config.selectedSnippets.map((s) => s.id));

  for (const snippet of snippets) {
    if (!existingIds.has(snippet.id)) {
      config.selectedSnippets.push(snippet);
      existingIds.add(snippet.id);
    }
  }

  saveConfig(config, cwd);
  return config;
}

/** Remove snippets from selection by ID. Returns updated config. */
export function removeSelectedSnippets(ids: string[], cwd = process.cwd()): ProjectConfig {
  const config = loadOrCreateConfig(cwd);
  const idsToRemove = new Set(ids);
  config.selectedSnippets = config.selectedSnippets.filter(
    (s) => !idsToRemove.has(s.id)
  );
  saveConfig(config, cwd);
  return config;
}
