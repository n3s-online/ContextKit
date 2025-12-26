#!/usr/bin/env node
import { Command } from 'commander';
import { displayId, printBlock, detectLanguage } from './lib/format';

// Re-export format utilities for commands
export { displayId, printBlock, detectLanguage };

const program = new Command();

program
  .name('contextkit')
  .description('Manage context snippets for AI coding agents')
  .version('0.0.1')
  .option('--json', 'Output results as JSON');

/** Check if JSON output is enabled from command options */
export function isJsonOutput(cmd: Command): boolean {
  return cmd.optsWithGlobals().json ?? false;
}

/** Output data - formats as JSON or human-readable */
export function output(cmd: Command, data: unknown, humanReadable?: string): void {
  if (isJsonOutput(cmd)) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(humanReadable ?? data);
  }
}

/** Output error - formats as JSON or human-readable */
export function outputError(cmd: Command, error: Error | string, code = 1): never {
  const message = error instanceof Error ? error.message : error;
  if (isJsonOutput(cmd)) {
    console.error(JSON.stringify({ error: message, code }));
  } else {
    console.error(`Error: ${message}`);
  }
  process.exit(code);
}

export { program };

// Import commands (must be after program export)
import './commands/doctor';
import './commands/search';
import './commands/snippet';
import './commands/select';
import './commands/deselect';
import './commands/list';
import './commands/generate';
import './commands/onboard';

program.parse();
