import { getDB } from './schema';
import type { JournalEntry, EntryType, Priority } from '../../types';

export async function putEntry(entry: JournalEntry): Promise<void> {
  const db = await getDB();
  await db.put('entries', entry);
}

export async function getEntry(id: string): Promise<JournalEntry | undefined> {
  const db = await getDB();
  return db.get('entries', id);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('entries', id);
}

export async function getAllEntries(): Promise<JournalEntry[]> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('entries', 'by-created_at');
  return entries.reverse();
}

export async function getEntriesByType(type: EntryType): Promise<JournalEntry[]> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('entries', 'by-entry_type', type);
  return entries.sort((a, b) => b.created_at - a.created_at);
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
      const order: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });
}

export async function getOpenBlockers(): Promise<JournalEntry[]> {
  const db = await getDB();
  const blockers = await db.getAllFromIndex('entries', 'by-entry_type', 'blocker');
  return blockers.filter((e) => !e.is_done).sort((a, b) => b.created_at - a.created_at);
}

export async function getStarredEntries(): Promise<JournalEntry[]> {
  const all = await getAllEntries();
  return all.filter((e) => e.starred);
}

export async function toggleStar(entry: JournalEntry): Promise<JournalEntry> {
  const updated = { ...entry, starred: !entry.starred, timestamp: Date.now() };
  await putEntry(updated);
  return updated;
}

export async function getExistingProjects(): Promise<string[]> {
  const entries = await getAllEntries();
  const projects = new Set<string>();
  for (const e of entries) if (e.project) projects.add(e.project);
  return [...projects];
}

export async function getTopTags(limit = 20): Promise<string[]> {
  const entries = await getAllEntries();
  const counts = new Map<string, number>();
  for (const e of entries) for (const tag of e.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([tag]) => tag);
}

/** Full-text search: raw_text + tags + project. Returns scored results, best first. */
export async function searchEntries(query: string): Promise<JournalEntry[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/);
  const all = await getAllEntries();
  return all
    .map((e) => {
      const haystack = [
        e.raw_text,
        ...e.tags,
        e.project ?? '',
        e.entry_type.replace('_', ' '),
      ].join(' ').toLowerCase();
      const score = terms.reduce((s, t) => {
        const occurrences = (haystack.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
        return s + occurrences;
      }, 0);
      return { entry: e, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry);
}

/** Get all entries that link TO a given entry id (backlinks). */
export async function getBacklinks(id: string): Promise<JournalEntry[]> {
  const all = await getAllEntries();
  return all.filter((e) => e.links?.includes(id));
}

export async function clearAllEntries(): Promise<void> {
  const db = await getDB();
  await db.clear('entries');
}

export async function importEntries(entries: JournalEntry[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('entries', 'readwrite');
  // Ensure imported entries have v2 fields
  const normalized = entries.map((e) => ({
    ...e,
    links: e.links ?? [],
    starred: e.starred ?? false,
  }));
  await Promise.all([...normalized.map((e) => tx.store.put(e)), tx.done]);
}
