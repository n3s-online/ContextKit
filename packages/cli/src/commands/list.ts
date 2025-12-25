import { Command } from 'commander';
import { program, output, isJsonOutput, displayId, printBlock } from '../index';
import { getSnippetsByIds } from '@contextkit/shared';
import { getDb } from '../lib/db';
import { loadOrCreateConfig } from '../lib/config';

program
  .command('list')
  .description('Show currently selected snippets')
  .action(async function(this: Command) {
    const cmd = this;
    const config = loadOrCreateConfig();

    if (config.selectedSnippets.length === 0) {
      if (isJsonOutput(cmd)) {
        output(cmd, { snippets: [], total: 0 });
      } else {
        printBlock(
          'No snippets selected',
          "Use 'contextkit search' to find snippets"
        );
      }
      return;
    }

    const db = getDb();
    const ids = config.selectedSnippets.map((s) => s.id);
    const snippets = getSnippetsByIds(db, ids);
    const snippetMap = new Map(snippets.map((s) => [s.id, s]));

    // Build list with full data where available
    const list = config.selectedSnippets.map((selected) => {
      const full = snippetMap.get(selected.id);
      return {
        id: selected.id,
        title: full?.title ?? selected.title,
        tags: full?.tags ?? [],
        selectedAt: selected.selectedAt,
        exists: !!full,
      };
    });

    if (isJsonOutput(cmd)) {
      output(cmd, { snippets: list, total: list.length });
    } else {
      const lines = [`Selected snippets (${list.length}):`, ''];
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const status = s.exists ? '' : ' [MISSING]';
        lines.push(`${i + 1}. [${displayId(s.id)}] ${s.title}${status}`);
        if (s.tags.length > 0) {
          lines.push(`   Tags: ${s.tags.join(', ')}`);
        }
      }
      lines.push('');
      lines.push("Use 'contextkit generate' to output markdown");
      printBlock(...lines);
    }
  });
