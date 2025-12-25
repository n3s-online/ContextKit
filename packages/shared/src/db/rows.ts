import type { Snippet, SnippetVersion } from '../types';

/** Database row for snippets table */
export interface SnippetRow {
  id: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

/** Database row for snippet_versions table */
export interface VersionRow {
  id: string;
  snippet_id: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
}

/** Convert database row to Snippet domain object */
export function rowToSnippet(row: SnippetRow): Snippet {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert database row to SnippetVersion domain object */
export function rowToVersion(row: VersionRow): SnippetVersion {
  return {
    id: row.id,
    snippetId: row.snippet_id,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags),
    createdAt: row.created_at,
  };
}
