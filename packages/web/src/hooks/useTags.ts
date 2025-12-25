import { useState, useCallback } from 'react';

export function useTags(initialTags: string[] = []) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  const resetTags = useCallback((newTags: string[]) => {
    setTags(newTags);
    setTagInput('');
  }, []);

  return {
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleKeyDown,
    resetTags,
  };
}
