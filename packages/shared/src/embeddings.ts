import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';

let embedder: FeatureExtractionPipeline | null = null;

/**
 * Get or initialize the embedding pipeline
 * Model cached at ~/.cache/huggingface/
 */
async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!embedder) {
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    ) as FeatureExtractionPipeline;
  }
  return embedder;
}

/**
 * Generate embedding for text
 * Returns 384-dimensional normalized vector
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbedder();

  const output = await pipe(text, {
    pooling: 'mean',
    normalize: true
  });

  return Array.from(output.data as Float32Array);
}

/**
 * Generate embedding for a snippet
 * Combines title, tags, content for better semantic matching
 */
export async function getSnippetEmbedding(
  title: string,
  tags: string[],
  content: string
): Promise<number[]> {
  const text = `${title}\n${tags.join(', ')}\n${content}`;
  return getEmbedding(text);
}

/**
 * Check if model is downloaded
 */
export async function isModelReady(): Promise<boolean> {
  try {
    await getEmbedder();
    return true;
  } catch {
    return false;
  }
}

/**
 * Preload the model (useful for CLI doctor command)
 */
export async function preloadModel(): Promise<{ latencyMs: number }> {
  const start = Date.now();
  await getEmbedder();
  return { latencyMs: Date.now() - start };
}

/**
 * For testing: reset the embedder singleton
 * Allows tests to start fresh or inject mocks
 */
export function resetEmbedder(): void {
  embedder = null;
}
