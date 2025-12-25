import type Database from 'better-sqlite3';
import type { SearchResult } from './types';
import { getEmbedding, getSnippetEmbedding } from './embeddings';
import { searchSimilar, upsertEmbedding } from './db/vectors';
import { getSnippetsByIds } from './db/repository';
import type { Snippet } from './types';

/**
 * Search for snippets by semantic similarity
 * Uses batch query to avoid N+1 problem
 */
export async function searchSnippets(
  db: Database.Database,
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const queryEmbedding = await getEmbedding(query);
  const matches = searchSimilar(db, queryEmbedding, limit);

  if (matches.length === 0) return [];

  // Batch fetch all snippets in one query
  const snippetIds = matches.map(m => m.snippetId);
  const snippets = getSnippetsByIds(db, snippetIds);

  // Create lookup map for O(1) access
  const snippetMap = new Map(snippets.map(s => [s.id, s]));

  // Build results preserving distance order
  const results: SearchResult[] = [];
  for (const match of matches) {
    const snippet = snippetMap.get(match.snippetId);
    if (snippet) {
      /**
       * Convert L2 distance to similarity score (0-1)
       * sqlite-vec uses L2 (Euclidean) distance by default.
       * Formula: score = 1 / (1 + distance)
       * - distance=0 -> score=1 (identical)
       * - distance=1 -> score=0.5
       * - distance->inf -> score->0
       */
      const score = 1 / (1 + match.distance);
      results.push({ snippet, score });
    }
  }

  return results;
}

/**
 * Update embedding when snippet changes
 */
export async function updateSnippetEmbedding(
  db: Database.Database,
  snippet: Snippet
): Promise<void> {
  const embedding = await getSnippetEmbedding(
    snippet.title,
    snippet.tags,
    snippet.content
  );

  upsertEmbedding(db, snippet.id, embedding);
}
