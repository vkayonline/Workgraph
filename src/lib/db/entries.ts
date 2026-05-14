import { getDB } from './schema';
import type { JournalEntry, EntryType, Project, Tag, Attachment, Edge, Commitment, CommitmentStatus } from '../../types';

export async function putEntry(entry: JournalEntry): Promise<void> {
  const db = await getDB();
  try {
    await db.put('entries', entry);
  } catch (err) {
    console.error('Failed to save entry to IndexedDB:', err);
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      alert('Storage quota exceeded. Please free up space or export/clear old data.');
    }
    throw err;
  }
}

export async function getEntry(id: string): Promise<JournalEntry | undefined> {
  const db = await getDB();
  return db.get('entries', id);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('entries', id);
}

export async function getEntriesPaginated(limit: number = 50, offset = 0): Promise<JournalEntry[]> {
  const db = await getDB();
  const tx = db.transaction('entries', 'readonly');
  const index = tx.store.index('by-created_at');
  let cursor = await index.openCursor(null, 'prev');
  
  const results: JournalEntry[] = [];
  let skipped = 0;
  
  while (cursor && results.length < limit) {
    if (skipped < offset) {
      skipped++;
      cursor = await cursor.continue();
      continue;
    }
    results.push(cursor.value);
    cursor = await cursor.continue();
  }
  return results;
}

export async function getEntriesByType(type: EntryType, limit = 50): Promise<JournalEntry[]> {
  const db = await getDB();
  const tx = db.transaction('entries', 'readonly');
  const index = tx.store.index('by-entry_type');
  let cursor = await index.openCursor(IDBKeyRange.only(type), 'prev');
  
  const results: JournalEntry[] = [];
  while (cursor && results.length < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
  }
  return results.sort((a, b) => b.created_at - a.created_at);
}

export async function getEntriesInRange(from: number, to: number): Promise<JournalEntry[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(from, to);
  const entries = await db.getAllFromIndex('entries', 'by-created_at', range);
  return entries.reverse();
}

export async function getTodayEntries(): Promise<JournalEntry[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return getEntriesInRange(start.getTime(), end.getTime());
}

export async function getPendingTasks(): Promise<JournalEntry[]> {
  const db = await getDB();
  const tasks = await db.getAllFromIndex('entries', 'by-entry_type', 'task');
  return tasks
    .filter((e) => !e.is_done)
    .sort((a, b) => {
      // Sort by operational_gravity in descending order (higher gravity = higher priority)
      return b.operational_gravity - a.operational_gravity;
    });
}

export async function getOpenIssues(): Promise<JournalEntry[]> {
  const db = await getDB();
  const issues = await db.getAllFromIndex('entries', 'by-entry_type', 'issue');
  return issues.filter((e) => !e.is_done).sort((a, b) => b.created_at - a.created_at);
}

export async function getStarredEntries(): Promise<JournalEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('entries', 'by-starred', 1);
}

export async function toggleStar(entry: JournalEntry): Promise<JournalEntry> {
  const updated = { ...entry, starred: !entry.starred, timestamp: Date.now() };
  await putEntry(updated);
  return updated;
}

// ---------------------------------------------------------
// Normalized Entity Fetchers
// ---------------------------------------------------------

export async function putCommitment(commitment: Commitment): Promise<void> {
  const db = await getDB();
  await db.put('commitments', commitment);
}

export async function getCommitment(id: string): Promise<Commitment | undefined> {
  const db = await getDB();
  return db.get('commitments', id);
}

export async function getCommitmentsByStatus(status: CommitmentStatus): Promise<Commitment[]> {
  const db = await getDB();
  return db.getAllFromIndex('commitments', 'by-status', status);
}

export async function deleteCommitment(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('commitments', id);
}

export async function getProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll('projects');
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function getTagsForEntry(entryId: string): Promise<Tag[]> {
  const db = await getDB();
  const entryTags = await db.getAllFromIndex('entry_tags', 'by-entry', entryId);
  const tags = await Promise.all(entryTags.map(et => db.get('tags', et.tag_id)));
  return tags.filter(Boolean) as Tag[];
}

export async function getAttachmentsForEntry(entryId: string): Promise<Attachment[]> {
  const db = await getDB();
  return db.getAllFromIndex('attachments', 'by-entry', entryId);
}

export async function getEdgesForSource(sourceId: string): Promise<Edge[]> {
  const db = await getDB();
  return db.getAllFromIndex('edges', 'by-source', sourceId);
}

export async function getEdgesForTarget(targetId: string): Promise<Edge[]> {
  const db = await getDB();
  return db.getAllFromIndex('edges', 'by-target', targetId);
}

export async function saveEdge(edge: Edge): Promise<void> {
  const db = await getDB();
  await db.put('edges', edge);
}

export async function deleteEdge(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('edges', id);
}

export async function getTopTags(limit = 20): Promise<Tag[]> {
  const db = await getDB();
  const allTags = await db.getAll('tags');
  
  // Note: For true scalability, we'd maintain a count on the tag object itself
  // via triggers on entry_tags insertion. For now, we do an IDB count.
  const tagsWithCount = await Promise.all(allTags.map(async (tag) => {
    const count = await db.countFromIndex('entry_tags', 'by-tag', tag.id);
    return { tag, count };
  }));
  
  return tagsWithCount
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(t => t.tag);
}

export async function searchEntries(query: string, limit = 50): Promise<JournalEntry[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/);
  
  // Pre-fetch all tags and map them to entries
  const db = await getDB();
  const allEntryTags = await db.getAll('entry_tags');
  const allTags = await db.getAll('tags');
  const tagNameMap = new Map(allTags.map(tag => [tag.id, tag.name]));
  const entryTagsMap = new Map<string, string[]>();

  for (const et of allEntryTags) {
    if (tagNameMap.has(et.tag_id)) {
      const tags = entryTagsMap.get(et.entry_id) || [];
      tags.push(tagNameMap.get(et.tag_id)!);
      entryTagsMap.set(et.entry_id, tags);
    }
  }

  const tx = db.transaction('entries', 'readonly');
  const store = tx.objectStore('entries');
  let cursor = await store.index('by-created_at').openCursor(null, 'prev');
  
  const results: { entry: JournalEntry, score: number }[] = [];
  
  while (cursor && results.length < limit * 2) { // Fetch slightly more to sort
    const e = cursor.value;
    const entryTags = entryTagsMap.get(e.id) || [];
    const haystack = [
      e.raw_text,
      e.entry_type.replace('_', ' '),
      ...entryTags,
    ].join(' ').toLowerCase();
    
    let score = 0;
    let matchesAll = true;
    
    for (const term of terms) {
      const occurrences = (haystack.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
      if (occurrences === 0) {
        matchesAll = false;
        break;
      }
      score += occurrences;
    }
    
    if (matchesAll && score > 0) {
      results.push({ entry: e, score });
    }
    cursor = await cursor.continue();
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.entry);
}

export async function clearAllEntries(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['entries', 'sessions', 'edges', 'projects', 'tags', 'entry_tags', 'attachments'], 'readwrite');
  await Promise.all([
    tx.objectStore('entries').clear(),
    tx.objectStore('sessions').clear(),
    tx.objectStore('edges').clear(),
    tx.objectStore('projects').clear(),
    tx.objectStore('tags').clear(),
    tx.objectStore('entry_tags').clear(),
    tx.objectStore('attachments').clear(),
    tx.done
  ]);
}
