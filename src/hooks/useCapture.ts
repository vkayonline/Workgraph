import { useState, useCallback } from 'react';
import { JournalRepository } from '../lib/db/repository';
import type { EntryType, JournalEntry } from '../types';

interface CaptureInput {
  text: string;
  hintType?: EntryType;
  durationMinutes?: number;
}

/**
 * Hook for capturing new journal entries. 
 * Entries are saved to the repository immediately in a 'pending' state.
 * The background worker will pick them up for enrichment (classification/embedding).
 */
export function useCapture() {
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async ({ text, hintType, durationMinutes }: CaptureInput) => {
    setLoading(true);
    const id = crypto.randomUUID();
    const now = Date.now();

    const entry: JournalEntry = {
      id,
      created_at: now,
      timestamp: now,
      raw_text: text,
      entry_type: hintType ?? 'work_log',
      project_id: null,
      session_id: null,
      operational_gravity: 0.5,
      is_done: false,
      duration_minutes: durationMinutes ?? null,
      starred: false,
      embedding_vector: null,
      classification_status: 'pending',
      embedding_status: 'pending',
    };

    await JournalRepository.save(entry);
    setLoading(false);
    return id;
  }, []);

  return { submit, loading };
}
