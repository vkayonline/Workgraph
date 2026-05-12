import { useState, useEffect, useCallback } from 'react';
import { getAllEntries, putEntry, deleteEntry } from '../lib/db/entries';
import type { JournalEntry } from '../types';

export function useEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await getAllEntries();
    setEntries(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('workgraph:entry-saved', refresh);
    return () => window.removeEventListener('workgraph:entry-saved', refresh);
  }, [refresh]);

  const update = useCallback(async (entry: JournalEntry) => {
    await putEntry(entry);
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, loading, refresh, update, remove };
}
