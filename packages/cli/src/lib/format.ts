/**
 * Formatting utilities for CLI output
 */

const ID_DISPLAY_LENGTH = 8;

/** Truncate ID for display */
export function displayId(id: string): string {
  return id.slice(0, ID_DISPLAY_LENGTH);
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
  const langTags = [
    'typescript', 'javascript', 'python', 'rust', 'go', 'java',
    'c', 'cpp', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'bash',
    'shell', 'html', 'css', 'json', 'yaml', 'markdown', 'tsx', 'jsx',
  ];

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
