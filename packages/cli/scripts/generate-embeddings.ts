#!/usr/bin/env npx tsx
/**
 * Generate embeddings for builtin snippets
 * Run: npx tsx packages/cli/scripts/generate-embeddings.ts
 */
import fs from 'fs';
import path from 'path';
import { getSnippetEmbedding } from '@contextkit/shared';

interface BuiltinSnippetTemplate {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

interface BuiltinSnippet extends BuiltinSnippetTemplate {
  embedding: number[];
}

const TEMPLATE_PATH = path.join(__dirname, '../src/builtin/snippets-template.json');
const OUTPUT_PATH = path.join(__dirname, '../src/builtin/snippets.json');

async function main() {
  console.log('Loading snippet templates...');
  const templates: BuiltinSnippetTemplate[] = JSON.parse(
    fs.readFileSync(TEMPLATE_PATH, 'utf-8')
  );

  console.log(`Generating embeddings for ${templates.length} snippets...`);
  const snippets: BuiltinSnippet[] = [];

  for (const template of templates) {
    console.log(`  - ${template.title}`);
    const embedding = await getSnippetEmbedding(
      template.title,
      template.tags,
      template.content
    );
    snippets.push({ ...template, embedding });
  }

  console.log(`Writing to ${OUTPUT_PATH}...`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(snippets, null, 2));
  console.log('Done!');
}

main().catch(console.error);
