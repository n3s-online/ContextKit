import { Command } from 'commander';
import { program, output, outputError, isJsonOutput, detectLanguage, printBlock } from '../index';
import { getDb, getSnippetsByIds } from '@contextkit/shared';
import { loadOrCreateConfig } from '../lib/config';
import fs from 'fs';

program
  .command('generate')
  .description('Output markdown for selected snippets')
  .option('-o, --output <file>', 'Write to file instead of stdout')
  .action(async function(this: Command, opts: { output?: string }) {
    const cmd = this;
    const config = loadOrCreateConfig();

    if (config.selectedSnippets.length === 0) {
      if (isJsonOutput(cmd)) {
        output(cmd, { markdown: '', snippetCount: 0 });
      } else {
        printBlock(
          'No snippets selected',
          "Use 'contextkit select' to add snippets"
        );
      }
      return;
    }

    const db = getDb();
    const ids = config.selectedSnippets.map((s) => s.id);
    const snippets = getSnippetsByIds(db, ids);

    if (snippets.length === 0) {
      return outputError(cmd, 'No snippets found in database');
    }

    // Generate markdown
    const sections: string[] = ['# ContextKit - Selected Snippets', ''];

    for (const snippet of snippets) {
      const lang = detectLanguage(snippet.tags, snippet.content);
      sections.push(`## ${snippet.title}`);
      sections.push('');
      sections.push(`**ID:** \`${snippet.id}\`  `);
      if (snippet.tags.length > 0) {
        sections.push(`**Tags:** ${snippet.tags.join(', ')}`);
      }
      sections.push('');
      sections.push('```' + lang);
      sections.push(snippet.content);
      sections.push('```');
      sections.push('');
      sections.push('---');
      sections.push('');
    }

    const markdown = sections.join('\n');

    if (isJsonOutput(cmd)) {
      output(cmd, { markdown, snippetCount: snippets.length });
    } else if (opts.output) {
      fs.writeFileSync(opts.output, markdown);
      console.log(`Written to ${opts.output}`);
    } else {
      console.log(markdown);
    }
  });
