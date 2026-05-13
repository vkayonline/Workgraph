import { 
  getAllEntries, 
  putEntry, 
  getExistingProjects, 
  getTopTags 
} from '../db/entries';
import { embedText } from '../llm/embed';
import { classifyEntry } from '../llm/classify';
import type { JournalEntry, Settings } from '../../types';

let currentSettings: Settings | null = null;
let isOnline = true;
let isRunning = false;

// Simple exponential backoff: 1min, 5min, 15min, 1h, 4h
const BACKOFF_SCHEDULE = [60000, 300000, 900000, 3600000, 14400000];

async function runLoop() {
  if (!isRunning || !currentSettings) return;

  try {
    const all = await getAllEntries();
    const now = Date.now();

    // Find entries that need work AND are eligible for retry
    const eligible = all.filter(e => {
      const metadata = e.processing_metadata || {};
      const nextRetry = metadata.next_retry_at || 0;
      return nextRetry <= now;
    });

    const pendingClassification = eligible.filter(e => e.classification_status !== 'processed');
    const pendingEmbedding = eligible.filter(e => e.embedding_status !== 'processed');

    if (pendingClassification.length === 0 && pendingEmbedding.length === 0) {
      setTimeout(runLoop, 30000); // Check again in 30s
      return;
    }

    // Process Classification (Priority 1)
    if (isOnline && currentSettings.apiKey && pendingClassification.length > 0) {
      const entry = pendingClassification[0];
      try {
        const [existingProjects, topTags] = await Promise.all([getExistingProjects(), getTopTags()]);
        const result = await classifyEntry({
          text: entry.raw_text,
          images: entry.images,
          profile: currentSettings.userProfile,
          apiKey: currentSettings.apiKey,
          baseUrl: currentSettings.baseUrl,
          model: currentSettings.model,
          existingProjects,
          topTags,
        });
        
        await putEntry({
          ...entry,
          ...result,
          classification_status: 'processed',
          timestamp: Date.now()
        });
        postMessage({ type: 'ENTRY_PROCESSED', id: entry.id });
      } catch (err) {
        await handleFailure(entry, 'classification', String(err));
      }
    }

    // Process Embedding (Priority 2)
    if (pendingEmbedding.length > 0) {
      const entry = pendingEmbedding[0];
      try {
        const vector = await embedText(
          entry.raw_text,
          currentSettings.apiKey,
          currentSettings.baseUrl,
          currentSettings.embeddingModel,
          currentSettings.embeddingSource
        );
        await putEntry({
          ...entry,
          embedding_vector: vector,
          embedding_status: 'processed'
        });
        postMessage({ type: 'ENTRY_PROCESSED', id: entry.id });
      } catch (err) {
        await handleFailure(entry, 'embedding', String(err));
      }
    }

    // Short delay between individual items to avoid blocking the DB for too long
    setTimeout(runLoop, 1000);
  } catch (err) {
    console.error('[Worker] Loop error:', err);
    setTimeout(runLoop, 10000);
  }
}

async function handleFailure(entry: JournalEntry, type: 'classification' | 'embedding', error: string) {
  const metadata = entry.processing_metadata || {};
  const retries = type === 'classification' 
    ? (metadata.classification_retries || 0) + 1 
    : (metadata.embedding_retries || 0) + 1;
  
  const backoffIdx = Math.min(retries - 1, BACKOFF_SCHEDULE.length - 1);
  const nextRetryAt = Date.now() + BACKOFF_SCHEDULE[backoffIdx];

  const updated: JournalEntry = {
    ...entry,
    [type === 'classification' ? 'classification_status' : 'embedding_status']: 'failed',
    processing_metadata: {
      ...metadata,
      [type === 'classification' ? 'classification_retries' : 'embedding_retries']: retries,
      next_retry_at: nextRetryAt,
      error
    }
  };

  await putEntry(updated);
  postMessage({ type: 'ENTRY_FAILED', id: entry.id, error });
}

self.onmessage = (e) => {
  const { type, payload } = e.data;
  switch (type) {
    case 'START':
      isRunning = true;
      runLoop();
      break;
    case 'STOP':
      isRunning = false;
      break;
    case 'UPDATE_SETTINGS':
      currentSettings = payload;
      break;
    case 'UPDATE_ONLINE_STATUS':
      isOnline = payload;
      break;
  }
};
