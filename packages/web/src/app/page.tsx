'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Snippet {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/snippets')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch snippets');
        return res.json();
      })
      .then(setSnippets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Get all unique tags
  const allTags = [...new Set(snippets.flatMap((s) => s.tags))].sort();

  // Filter snippets
  const filtered = snippets.filter((s) => {
    const matchesSearch =
      search === '' ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === null || s.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-zinc-500">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-500">Error: {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">ContextKit</h1>
        <Link
          href="/snippets/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Snippet
        </Link>
      </header>

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search snippets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded bg-transparent border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded text-sm ${
                selectedTag === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Snippet list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          {snippets.length === 0 ? (
            <p>No snippets yet. Create your first one!</p>
          ) : (
            <p>No snippets match your search.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((snippet) => (
            <Link
              key={snippet.id}
              href={`/snippets/${snippet.id}`}
              className="block p-4 border rounded border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <h2 className="font-semibold mb-1">{snippet.title}</h2>
              <p className="text-sm text-zinc-500 line-clamp-2 mb-2">
                {snippet.content.slice(0, 150)}
                {snippet.content.length > 150 && '...'}
              </p>
              {snippet.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {snippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
