#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('contextkit')
  .description('Manage context snippets for AI coding agents')
  .version('0.0.1');

// Commands will be added here

program.parse();
