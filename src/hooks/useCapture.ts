import { useState, useCallback } from 'react';
import { putEntry, getExistingProjects, getTopTags } from '../lib/db/entries';
import { classifyEntry } from '../lib/llm/classify';
import { embedText } from '../lib/llm/embed';
import { useSettingsContext } from '../contexts/SettingsContext';
import { useNetworkStatus } from './useNetworkStatus';
import type { EntryImage, EntryType, JournalEntry } from '../types';

interface CaptureInput {
  text: string;
  images: EntryImage[];
  hintType?: EntryType;
}

export function useCapture() {
  const { settings } = useSettingsContext();
  const online = useNetworkStatus();
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async ({ text, images, hintType }: CaptureInput) => {
    setLoading(true);
    const id = crypto.randomUUID();
    const now = Date.now();

    const skeleton: JournalEntry = {
      id,
      created_at: now,
      timestamp: now,
      raw_text: text,
      images,
      entry_type: hintType ?? 'work_log',
      tags: [],
      project: null,
      priority: 'medium',
      sentiment: 'neutral',
      is_done: false,
      duration_minutes: null,
      starred: false,
      embedding_vector: null,
    };

    await putEntry(skeleton);
    // Show in UI immediately — classification + embedding patch silently after
    window.dispatchEvent(new CustomEvent('workgraph:entry-saved'));
    setLoading(false);

    if (online && settings.apiKey) {
      enrichEntry(skeleton, text, images, settings).catch(() => {});
    }

    return id;
  }, [settings, online]);

  return { submit, loading };
}

async function enrichEntry(
  skeleton: JournalEntry,
  text: string,
  images: EntryImage[],
  settings: ReturnType<typeof import('../contexts/SettingsContext').useSettingsContext>['settings'],
) {
  const [existingProjects, topTags] = await Promise.all([
    getExistingProjects(),
    getTopTags(),
  ]);

  let classified: JournalEntry = skeleton;

  try {
    const result = await classifyEntry({
      text,
      images,
      profile: settings.userProfile,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: settings.model,
      existingProjects,
      topTags,
    });
    classified = { ...skeleton, ...result, timestamp: Date.now() };
    await putEntry(classified);
    window.dispatchEvent(new CustomEvent('workgraph:entry-saved'));
  } catch {
    // Classification failed — skeleton entry persists
  }

  try {
    const vector = await embedText(
      text,
      settings.apiKey,
      settings.baseUrl,
      settings.embeddingModel,
    );
    await putEntry({ ...classified, embedding_vector: vector });
  } catch {
    // Embedding failed — entry still usable, just no semantic search
  }
}
