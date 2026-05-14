import { getEntriesPaginated } from './db/entries';
import { getDB } from './db/schema';

export interface DiagnosticReport {
  totalEntries: number;
  unclassifiedEntries: number;
  unembeddedEntries: number;
  failedClassifications: number;
  failedEmbeddings: number;
  duplicateIds: number;
  storageUsageEstimateMB: number;
  avgClassificationRetries: number;
  avgEmbeddingRetries: number;
}

/**
 * Runs a comprehensive diagnostic check on the local data state.
 * This is used by AI agents and developers to identify data integrity issues.
 */
export async function runDiagnostics(): Promise<DiagnosticReport> {
  const all = await getEntriesPaginated(99999, 0); // Fetch all for diagnostics
  
  const classificationRetries = all.map(e => e.processing_metadata?.classification_retries || 0);
  const embeddingRetries = all.map(e => e.processing_metadata?.embedding_retries || 0);

  const report: DiagnosticReport = {
    totalEntries: all.length,
    unclassifiedEntries: all.filter(e => e.classification_status === 'pending').length,
    unembeddedEntries: all.filter(e => e.embedding_status === 'pending').length,
    failedClassifications: all.filter(e => e.classification_status === 'failed').length,
    failedEmbeddings: all.filter(e => e.embedding_status === 'failed').length,
    duplicateIds: all.length - new Set(all.map(e => e.id)).size,
    storageUsageEstimateMB: 0,
    avgClassificationRetries: classificationRetries.length ? classificationRetries.reduce((a, b) => a + b, 0) / classificationRetries.length : 0,
    avgEmbeddingRetries: embeddingRetries.length ? embeddingRetries.reduce((a, b) => a + b, 0) / embeddingRetries.length : 0,
  };

  // Estimate storage usage (crude estimate)
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      report.storageUsageEstimateMB = Math.round((estimate.usage ?? 0) / (1024 * 1024));
    }
  } catch {
    // Ignore if not supported
  }

  return report;
}

/**
 * Forces a re-processing of all failed entries.
 */
export async function retryAllFailed(): Promise<{ classification: number, embedding: number }> {
  const all = await getEntriesPaginated(99999, 0); // Fetch all for diagnostics
  let c = 0, e = 0;
  
  const db = await getDB();
  const tx = db.transaction('entries', 'readwrite');
  
  for (const entry of all) {
    let changed = false;
    if (entry.classification_status === 'failed') {
      entry.classification_status = 'pending';
      c++;
      changed = true;
    }
    if (entry.embedding_status === 'failed') {
      entry.embedding_status = 'pending';
      e++;
      changed = true;
    }
    if (changed) {
      await tx.store.put(entry);
    }
  }
  
  await tx.done;
  window.dispatchEvent(new CustomEvent('recall:entry-saved'));
  return { classification: c, embedding: e };
}
