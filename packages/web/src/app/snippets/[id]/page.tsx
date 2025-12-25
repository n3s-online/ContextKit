'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SnippetEditor } from '@/components/SnippetEditor';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { useTags } from '@/hooks/useTags';

interface SnippetVersion {
  id: string;
  snippetId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface Snippet {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  versions: SnippetVersion[];
}

export default function EditSnippet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { tags, tagInput, setTagInput, addTag, removeTag, handleKeyDown, resetTags } = useTags();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/snippets/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch snippet');
        return res.json();
      })
      .then((data: Snippet) => {
        setSnippet(data);
        setTitle(data.title);
        setContent(data.content);
        resetTags(data.tags);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, resetTags]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/snippets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content, tags }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update snippet');
      }

      // Refetch to get updated versions
      const refreshRes = await fetch(`/api/snippets/${id}`);
      if (refreshRes.ok) {
        const updated = await refreshRes.json();
        setSnippet(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete snippet');
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const restoreVersion = (version: SnippetVersion) => {
    setTitle(version.title);
    setContent(version.content);
    resetTags(version.tags);
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-zinc-500">Loading...</p>
      </main>
    );
  }

  if (error && !snippet) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-500">Error: {error}</p>
        <Link href="/" className="text-blue-500 hover:underline mt-4 block">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  if (!snippet) return null;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back
          </Link>
          <h1 className="text-xl font-bold">Edit Snippet</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            History ({snippet.versions.length})
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Delete
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
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

      <div className="flex-1 flex">
        {/* Version history sidebar */}
        {showVersions && (
          <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-4 overflow-auto h-[calc(100vh-200px)]">
            <h2 className="font-semibold mb-4 text-sm">Version History</h2>
            {snippet.versions.length === 0 ? (
              <p className="text-sm text-zinc-500">No previous versions</p>
            ) : (
              <div className="space-y-2">
                {snippet.versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => restoreVersion(version)}
                    className="w-full text-left p-2 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <p className="font-medium text-sm truncate">{version.title}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* Editor and preview */}
        <div className={`flex-1 flex ${showPreview ? 'divide-x divide-zinc-200 dark:divide-zinc-800' : ''}`}>
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-[calc(100vh-200px)]`}>
            <SnippetEditor value={content} onChange={setContent} />
          </div>
          {showPreview && (
            <div className="w-1/2 h-[calc(100vh-200px)] overflow-auto bg-zinc-50 dark:bg-zinc-900/50">
              <MarkdownPreview content={content} />
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Snippet?</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              This action cannot be undone. The snippet and all its versions will be permanently
              deleted.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
