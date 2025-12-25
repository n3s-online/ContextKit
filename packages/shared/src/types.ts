/**
 * A context snippet stored in the database
 */
export interface Snippet {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * A historical version of a snippet
 */
export interface SnippetVersion {
  id: string;
  snippetId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

/**
 * Project-level configuration stored in .contextkit/config.json
 */
export interface ProjectConfig {
  version: 1;
  selectedSnippets: SelectedSnippet[];
}

/**
 * A snippet selected for a project
 */
export interface SelectedSnippet {
  id: string;
  title: string;
  selectedAt: string;
}

/**
 * Result from semantic search
 */
export interface SearchResult {
  snippet: Snippet;
  score: number;
}

/**
 * Input for creating a new snippet
 */
export interface CreateSnippetInput {
  title: string;
  content: string;
  tags: string[];
}

/**
 * Input for updating an existing snippet
 */
export interface UpdateSnippetInput {
  title?: string;
  content?: string;
  tags?: string[];
}
