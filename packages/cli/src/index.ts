#!/usr/bin/env node
import { Command } from 'commander';

// Config constants
const ID_DISPLAY_LENGTH = 8;

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

/** Truncate ID for display */
export function displayId(id: string): string {
  return id.slice(0, ID_DISPLAY_LENGTH);
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

/** Print lines with consistent spacing (blank line before/after) */
export function printBlock(...lines: string[]): void {
  console.log('');
  for (const line of lines) {
    console.log(line);
  }
  console.log('');
}

/** Detect language from tags or content for syntax highlighting */
export function detectLanguage(tags: string[], content: string): string {
  // Check tags first
  const langTags = ['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c', 'cpp', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'bash', 'shell', 'html', 'css', 'json', 'yaml', 'markdown', 'tsx', 'jsx'];
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (langTags.includes(lower)) return lower;
    if (lower === 'ts') return 'typescript';
    if (lower === 'js') return 'javascript';
    if (lower === 'py') return 'python';
    if (lower === 'rb') return 'ruby';
    if (lower === 'sh') return 'bash';
    if (lower === 'md') return 'markdown';
  }

  // Simple content heuristics
  const firstLine = content.split('\n')[0] || '';
  if (firstLine.startsWith('#!/bin/bash') || firstLine.startsWith('#!/bin/sh')) return 'bash';
  if (firstLine.startsWith('#!/usr/bin/env python')) return 'python';
  if (firstLine.startsWith('#!/usr/bin/env node')) return 'javascript';
  if (content.includes('import React') || content.includes('from "react"')) return 'tsx';
  if (content.includes('interface ') || content.includes(': string') || content.includes(': number')) return 'typescript';
  if (content.includes('function ') || content.includes('const ') || content.includes('let ')) return 'javascript';
  if (content.includes('def ') && content.includes(':')) return 'python';
  if (content.includes('func ') && content.includes('package ')) return 'go';
  if (content.includes('fn ') && content.includes('let mut')) return 'rust';

  return '';
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
