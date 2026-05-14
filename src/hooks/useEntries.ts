import { useState, useEffect, useCallback } from 'react';
import { JournalRepository, DATA_EVENTS } from '../lib/db/repository';
import type { JournalEntry } from '../types';

/**
 * Hook for managing the collection of journal entries.
 * Listens for repository events to keep the local state synchronized.
 */
export function useEntries(initialLimit: number = 50) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchEntries = useCallback(async (currentOffset: number, append: boolean = false) => {
    setLoading(true);
    try {
      const results = await JournalRepository.getPaginated(initialLimit, currentOffset);
      if (results.length < initialLimit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      setEntries(prev => append ? [...prev, ...results] : results);
      setOffset(currentOffset + results.length);
    } finally {
      setLoading(false);
    }
  }, [initialLimit]);

  const refresh = useCallback(() => {
    return fetchEntries(0, false);
  }, [fetchEntries]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      return fetchEntries(offset, true);
    }
  }, [loading, hasMore, offset, fetchEntries]);

  useEffect(() => {
    refresh();
    
    const handler = () => refresh();
    window.addEventListener(DATA_EVENTS.ENTRY_SAVED, handler);
    window.addEventListener(DATA_EVENTS.ENTRY_DELETED, handler);
    
    return () => {
      window.removeEventListener(DATA_EVENTS.ENTRY_SAVED, handler);
      window.removeEventListener(DATA_EVENTS.ENTRY_DELETED, handler);
    };
  }, [refresh]);

  const update = useCallback(async (entry: JournalEntry) => {
    await JournalRepository.save(entry);
  }, []);

  const remove = useCallback(async (id: string) => {
    await JournalRepository.delete(id);
  }, []);

  return { entries, loading, hasMore, loadMore, refresh, update, remove };
}
