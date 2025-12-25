import { Command } from 'commander';
import { program, output, outputError, isJsonOutput, printBlock } from '../index';
import { getSnippet } from '@contextkit/shared';
import { getDb } from '../lib/db';

program
  .command('snippet <id>')
  .description('Fetch a snippet by ID')
  .action(async function(this: Command, id: string) {
    const cmd = this;
    const db = getDb();
    const snippet = getSnippet(db, id);

    if (!snippet) {
      return outputError(cmd, `Snippet not found: ${id}`);
    }

    if (isJsonOutput(cmd)) {
      output(cmd, snippet);
    } else {
      printBlock(
        `Snippet: ${snippet.id}`,
        `Title: ${snippet.title}`,
        `Tags: ${snippet.tags.join(', ') || 'none'}`,
        `Created: ${snippet.createdAt}`,
        `Updated: ${snippet.updatedAt}`,
        '',
        '---',
        snippet.content,
        '---'
      );
    }
  });
