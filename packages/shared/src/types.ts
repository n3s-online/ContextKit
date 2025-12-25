export interface Snippet {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SnippetVersion {
  id: string;
  snippetId: string;
  content: string;
  createdAt: string;
}

export interface ProjectConfig {
  selectedSnippets: string[];
}

export interface SearchResult {
  snippet: Snippet;
  score: number;
}
