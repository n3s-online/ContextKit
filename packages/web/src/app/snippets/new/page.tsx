'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SnippetEditor } from '@/components/SnippetEditor';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { useTags } from '@/hooks/useTags';

export default function NewSnippet() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { tags, tagInput, setTagInput, addTag, removeTag, handleKeyDown } = useTags();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content, tags }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create snippet');
      }

      const snippet = await res.json();
      router.push(`/snippets/${snippet.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back
          </Link>
          <h1 className="text-xl font-bold">New Snippet</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="p-4 space-y-4 border-b border-zinc-200 dark:border-zinc-800">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Snippet title..."
          className="w-full px-4 py-2 text-lg border rounded bg-transparent border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm flex items-center gap-1"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-100">
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
            placeholder="Add tags..."
            className="flex-1 min-w-[150px] px-2 py-1 border rounded bg-transparent border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      <div className={`flex-1 flex ${showPreview ? 'divide-x divide-zinc-200 dark:divide-zinc-800' : ''}`}>
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-[calc(100vh-200px)]`}>
          <SnippetEditor
            value={content}
            onChange={setContent}
            placeholder="Write your markdown content here..."
          />
        </div>
        {showPreview && (
          <div className="w-1/2 h-[calc(100vh-200px)] overflow-auto bg-zinc-50 dark:bg-zinc-900/50">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>
    </main>
  );
}
