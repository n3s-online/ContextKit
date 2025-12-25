import { Command } from 'commander';
import { program, output, isJsonOutput, printBlock } from '../index';
import { getDbPath, preloadModel } from '@contextkit/shared';
import { getDb } from '../lib/db';
import { loadConfig, hasConfigDir } from '../lib/config';
import fs from 'fs';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  details?: Record<string, unknown>;
}

program
  .command('doctor')
  .description('Run diagnostics on ContextKit installation')
  .action(async function(this: Command) {
    const cmd = this;
    const results: CheckResult[] = [];
    let allPassed = true;

    // Check 1: Database
    try {
      const dbPath = getDbPath();
      const exists = fs.existsSync(dbPath);
      const db = getDb();

      const snippetCount = db.prepare('SELECT COUNT(*) as count FROM snippets').get() as { count: number };
      const stats = exists ? fs.statSync(dbPath) : null;

      results.push({
        name: 'Database',
        status: 'pass',
        message: `Connected (${snippetCount.count} snippets)`,
        details: {
          path: dbPath,
          size: stats ? `${(stats.size / 1024).toFixed(1)} KB` : 'N/A',
          snippets: snippetCount.count,
        },
      });
    } catch (err) {
      allPassed = false;
      results.push({
        name: 'Database',
        status: 'fail',
        message: err instanceof Error ? err.message : 'Unknown error',
        details: { suggestion: 'Ensure better-sqlite3 is installed correctly' },
      });
    }

    // Check 2: Embeddings model (preloadModel handles both check and load)
    try {
      const { latencyMs } = await preloadModel();
      results.push({
        name: 'Embeddings',
        status: 'pass',
        message: `Model ready (${latencyMs}ms)`,
        details: { model: 'Xenova/all-MiniLM-L6-v2', latencyMs },
      });
    } catch (err) {
      allPassed = false;
      results.push({
        name: 'Embeddings',
        status: 'fail',
        message: err instanceof Error ? err.message : 'Unknown error',
        details: { suggestion: 'Check @xenova/transformers installation' },
      });
    }

    // Check 3: Project config
    try {
      if (hasConfigDir()) {
        const config = loadConfig();
        if (config) {
          results.push({
            name: 'Project Config',
            status: 'pass',
            message: `${config.selectedSnippets.length} snippets selected`,
            details: {
              version: config.version,
              selectedCount: config.selectedSnippets.length,
            },
          });
        } else {
          results.push({
            name: 'Project Config',
            status: 'pass',
            message: 'Directory exists but no config file',
            details: { initialized: false },
          });
        }
      } else {
        results.push({
          name: 'Project Config',
          status: 'pass',
          message: 'Not initialized (will create on first use)',
          details: { initialized: false },
        });
      }
    } catch (err) {
      allPassed = false;
      results.push({
        name: 'Project Config',
        status: 'fail',
        message: err instanceof Error ? err.message : 'Unknown error',
        details: { suggestion: 'Check .contextkit/config.json format' },
      });
    }

    // Output results
    if (isJsonOutput(cmd)) {
      output(cmd, { results, allPassed });
    } else {
      const lines = ['ContextKit Health Check', ''];
      for (const r of results) {
        const icon = r.status === 'pass' ? '\u2713' : '\u2717';
        lines.push(`${icon} ${r.name}: ${r.message}`);
      }
      lines.push('');
      lines.push(allPassed ? 'All checks passed' : 'Some checks failed');
      printBlock(...lines);
    }

    if (!allPassed) {
      process.exit(1);
    }
  });
