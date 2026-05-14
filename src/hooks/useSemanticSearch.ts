import { useState, useEffect } from 'react';
import { useEntries } from './useEntries';
import { embedText } from '../lib/llm/embed';
import { topK } from '../lib/search/cosine';
import type { JournalEntry } from '../types';

export function useSemanticSearch(query: string, limit = 3) {
  const [results, setResults] = useState<JournalEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { entries } = useEntries();

  useEffect(() => {
    if (!query.trim() || query.length < 4) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const queryVector = await embedText(query);
        const top = topK(queryVector, entries, limit);
        setResults(top);
      } catch (err) {
        console.error('Semantic search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 600); // Higher debounce for "live" typing to save cycles

    return () => clearTimeout(t);
  }, [query, entries, limit]);

  return { results, isSearching };
}
