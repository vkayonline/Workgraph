import { useState, useEffect, useCallback } from 'react';
import { JournalRepository, DATA_EVENTS } from '../lib/db/repository';
import type { JournalEntry } from '../types';

/**
 * Hook for managing the collection of journal entries.
 * Listens for repository events to keep the local state synchronized.
 */
export function useEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await JournalRepository.getAll();
      setEntries(all);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return { entries, loading, refresh, update, remove };
}
