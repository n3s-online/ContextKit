import { Command } from 'commander';
import { program, output, outputError, isJsonOutput, displayId, printBlock } from '../index';
import { getDb, searchSnippets } from '@contextkit/shared';

program
  .command('search <query>')
  .description('Search snippets by semantic similarity')
  .option('-l, --limit <n>', 'Number of results', '10')
  .option('-t, --threshold <n>', 'Minimum similarity score (0-1)', '0')
  .action(async function(this: Command, query: string, opts: { limit: string; threshold: string }) {
    const cmd = this;
    const limit = parseInt(opts.limit, 10);
    const threshold = parseFloat(opts.threshold);

    if (isNaN(limit) || limit < 1) {
      return outputError(cmd, 'Invalid limit value');
    }
    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      return outputError(cmd, 'Threshold must be between 0 and 1');
    }

    const db = getDb();
    const results = await searchSnippets(db, query, limit);
    const filtered = results.filter((r) => r.score >= threshold);

    if (isJsonOutput(cmd)) {
      output(cmd, { query, results: filtered });
    } else {
      if (filtered.length === 0) {
        printBlock('No results found');
        return;
      }

      const lines = [`Found ${filtered.length} result${filtered.length === 1 ? '' : 's'}:`, ''];
      for (let i = 0; i < filtered.length; i++) {
        const { snippet, score } = filtered[i];
        const preview = snippet.content.slice(0, 80).replace(/\n/g, ' ');
        lines.push(`${i + 1}. [${displayId(snippet.id)}] ${snippet.title} (${score.toFixed(2)})`);
        lines.push(`   Tags: ${snippet.tags.join(', ') || 'none'}`);
        lines.push(`   ${preview}${snippet.content.length > 80 ? '...' : ''}`);
        lines.push('');
      }
      printBlock(...lines);
    }
  });
