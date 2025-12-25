import { Command } from 'commander';
import { program, output, isJsonOutput, displayId, printBlock } from '../index';
import { loadOrCreateConfig, removeSelectedSnippets } from '../lib/config';

program
  .command('deselect <ids...>')
  .description('Remove snippets from project selection')
  .action(async function(this: Command, ids: string[]) {
    const cmd = this;
    const config = loadOrCreateConfig();
    const selectedIds = new Set(config.selectedSnippets.map((s) => s.id));

    // Find which ones are actually selected
    const toRemove = ids.filter((id) => selectedIds.has(id));
    const removed = config.selectedSnippets.filter((s) => toRemove.includes(s.id));

    if (toRemove.length === 0) {
      if (isJsonOutput(cmd)) {
        output(cmd, { removed: [], total: config.selectedSnippets.length });
      } else {
        printBlock('None of the specified snippets were selected');
      }
      return;
    }

    const updatedConfig = removeSelectedSnippets(toRemove);

    if (isJsonOutput(cmd)) {
      output(cmd, {
        removed,
        total: updatedConfig.selectedSnippets.length,
      });
    } else {
      const lines = [`Removed ${removed.length} snippet${removed.length === 1 ? '' : 's'}:`];
      for (const s of removed) {
        lines.push(`  - [${displayId(s.id)}] ${s.title}`);
      }
      lines.push('');
      lines.push(`Total selected: ${updatedConfig.selectedSnippets.length}`);
      printBlock(...lines);
    }
  });
