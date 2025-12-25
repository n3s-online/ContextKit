import { Command } from 'commander';
import { program, output, isJsonOutput, printBlock } from '../index';
import fs from 'fs';
import path from 'path';

// onboard.md is copied to dist/ during build
const onboardPath = path.join(__dirname, 'onboard.md');
const ONBOARD_TEXT = fs.existsSync(onboardPath)
  ? fs.readFileSync(onboardPath, 'utf-8')
  : '# ContextKit\n\nRun `contextkit --help` for usage.';

program
  .command('onboard')
  .description('Show setup guide for AI agents')
  .action(function(this: Command) {
    const cmd = this;
    if (isJsonOutput(cmd)) {
      output(cmd, {
        guide: ONBOARD_TEXT.trim(),
        commands: [
          { name: 'search', args: '<query>', description: 'Semantic search' },
          { name: 'snippet', args: '<id>', description: 'View single snippet' },
          { name: 'select', args: '<id...>', description: 'Add to selection' },
          { name: 'deselect', args: '<id...>', description: 'Remove from selection' },
          { name: 'list', args: '', description: 'Show selection' },
          { name: 'generate', args: '', description: 'Output markdown' },
          { name: 'doctor', args: '', description: 'Health check' },
          { name: 'onboard', args: '', description: 'This guide' },
        ],
      });
    } else {
      printBlock(ONBOARD_TEXT.trim());
    }
  });
