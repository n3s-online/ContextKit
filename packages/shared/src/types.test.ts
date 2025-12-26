import { describe, it, expect } from 'vitest';
import type { Snippet, SearchResult } from './types';

describe('types', () => {
  it('Snippet type is valid', () => {
    const snippet: Snippet = {
      id: 'test-123',
      title: 'Test Snippet',
      content: 'Test content',
      tags: ['test'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(snippet.id).toBe('test-123');
    expect(snippet.tags).toContain('test');
  });

  it('SearchResult type is valid', () => {
    const result: SearchResult = {
      snippet: {
        id: 'test-456',
        title: 'Search Result',
        content: 'Found content',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      score: 0.95,
    };

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
