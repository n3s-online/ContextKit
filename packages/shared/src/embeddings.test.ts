import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import {
  getEmbedding,
  getSnippetEmbedding,
  isModelReady,
  preloadModel,
  resetEmbedder,
} from './embeddings';

describe('embeddings', () => {
  // Model is cached after first load, so subsequent tests are fast
  beforeAll(async () => {
    await preloadModel();
  }, 60000); // 60s timeout for initial model download

  afterEach(() => {
    // Don't reset to avoid reloading model each test
    // resetEmbedder();
  });

  describe('getEmbedding', () => {
    it('returns 384-dimensional vector', async () => {
      const embedding = await getEmbedding('test text');
      expect(embedding.length).toBe(384);
    });

    it('returns normalized vector (unit length)', async () => {
      const embedding = await getEmbedding('test text');
      const magnitude = Math.sqrt(
        embedding.reduce((sum, v) => sum + v * v, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 5);
    });

    it('returns numbers', async () => {
      const embedding = await getEmbedding('test');
      for (const value of embedding) {
        expect(typeof value).toBe('number');
        expect(Number.isFinite(value)).toBe(true);
      }
    });

    it('returns different embeddings for different text', async () => {
      const e1 = await getEmbedding('hello world');
      const e2 = await getEmbedding('goodbye universe');

      // Calculate cosine similarity
      const dotProduct = e1.reduce((sum, v, i) => sum + v * e2[i], 0);
      // For different texts, similarity should be less than 1
      expect(dotProduct).toBeLessThan(0.95);
    });

    it('returns similar embeddings for similar text', async () => {
      const e1 = await getEmbedding('the quick brown fox');
      const e2 = await getEmbedding('a fast brown fox');

      const dotProduct = e1.reduce((sum, v, i) => sum + v * e2[i], 0);
      // Similar texts should have high similarity
      expect(dotProduct).toBeGreaterThan(0.7);
    });
  });

  describe('getSnippetEmbedding', () => {
    it('combines title, tags, and content', async () => {
      const embedding = await getSnippetEmbedding(
        'TypeScript Guide',
        ['typescript', 'programming'],
        'Learn TypeScript basics'
      );

      expect(embedding.length).toBe(384);
    });

    it('returns normalized vector', async () => {
      const embedding = await getSnippetEmbedding('Title', ['tag'], 'Content');
      const magnitude = Math.sqrt(
        embedding.reduce((sum, v) => sum + v * v, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 5);
    });
  });

  describe('isModelReady', () => {
    it('returns true when model is loaded', async () => {
      const ready = await isModelReady();
      expect(ready).toBe(true);
    });
  });

  describe('preloadModel', () => {
    it('returns latency in ms', async () => {
      const result = await preloadModel();
      expect(result).toHaveProperty('latencyMs');
      expect(typeof result.latencyMs).toBe('number');
      // Should be fast since already loaded
      expect(result.latencyMs).toBeLessThan(1000);
    });
  });

  describe('resetEmbedder', () => {
    it('clears cached embedder', () => {
      expect(() => resetEmbedder()).not.toThrow();
    });
  });
});
