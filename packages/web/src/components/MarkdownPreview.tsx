'use client';

import { useMemo, useState, useEffect } from 'react';
import { marked } from 'marked';

interface Props {
  content: string;
}

export function MarkdownPreview({ content }: Props) {
  const [DOMPurify, setDOMPurify] = useState<typeof import('dompurify').default | null>(null);

  useEffect(() => {
    import('dompurify').then((mod) => setDOMPurify(() => mod.default));
  }, []);

  const html = useMemo(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
      async: false,
    });
    const raw = marked.parse(content);
    if (typeof raw !== 'string') {
      return '';
    }
    if (!DOMPurify) {
      // SSR fallback - escape HTML
      return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    return DOMPurify.sanitize(raw);
  }, [content, DOMPurify]);

  return (
    <div
      className="prose prose-zinc dark:prose-invert max-w-none p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
