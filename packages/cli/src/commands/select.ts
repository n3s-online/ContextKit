import { Command } from 'commander';
import { program, output, outputError, isJsonOutput, displayId, printBlock } from '../index';
import { getDb, getSnippetsByIds } from '@contextkit/shared';
import type { SelectedSnippet } from '@contextkit/shared';
import { loadOrCreateConfig, addSelectedSnippets } from '../lib/config';

program
  .command('select <ids...>')
  .description('Add snippets to project selection')
  .action(async function(this: Command, ids: string[]) {
    const cmd = this;
    const db = getDb();

    // Validate all IDs exist
    const snippets = getSnippetsByIds(db, ids);
    const foundIds = new Set(snippets.map((s) => s.id));
    const missing = ids.filter((id) => !foundIds.has(id));

    if (missing.length > 0) {
      return outputError(cmd, `Snippets not found: ${missing.join(', ')}`);
    }

    // Get current selection to check for duplicates
    const config = loadOrCreateConfig();
    const alreadySelected = new Set(config.selectedSnippets.map((s) => s.id));
    const newSnippets = snippets.filter((s) => !alreadySelected.has(s.id));

    if (newSnippets.length === 0) {
      if (isJsonOutput(cmd)) {
        output(cmd, { added: [], total: config.selectedSnippets.length });
      } else {
        printBlock('All snippets already selected');
      }
      return;
    }

    // Add to selection
    const now = new Date().toISOString();
    const toAdd: SelectedSnippet[] = newSnippets.map((s) => ({
      id: s.id,
      title: s.title,
      selectedAt: now,
    }));

    const updatedConfig = addSelectedSnippets(toAdd);

    if (isJsonOutput(cmd)) {
      output(cmd, {
        added: toAdd,
        total: updatedConfig.selectedSnippets.length,
      });
    } else {
      const lines = [`Added ${toAdd.length} snippet${toAdd.length === 1 ? '' : 's'}:`];
      for (const s of toAdd) {
        lines.push(`  - [${displayId(s.id)}] ${s.title}`);
      }
      lines.push('');
      lines.push(`Total selected: ${updatedConfig.selectedSnippets.length}`);
      printBlock(...lines);
    }
  });
