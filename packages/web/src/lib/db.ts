import { getDb } from '@contextkit/shared';

/**
 * Get database connection.
 * Schema is automatically initialized by getDb().
 */
export function db() {
  return getDb();
}

// UUID v4 regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format to avoid wasted DB roundtrips
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validate tags array - must be array of non-empty strings
 */
export function validateTags(tags: unknown): string[] | null {
  if (!Array.isArray(tags)) return null;
  for (const tag of tags) {
    if (typeof tag !== 'string' || tag.trim() === '') {
      return null;
    }
  }
  return tags as string[];
}
