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

export async function getTodayEntries(): Promise<JournalEntry[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const db = await getDB();
  const range = IDBKeyRange.bound(start.getTime(), end.getTime());
  const entries = await db.getAllFromIndex('entries', 'by-created_at', range);
  return entries.reverse();
}

export async function getPendingTasks(): Promise<JournalEntry[]> {
  const db = await getDB();
  const tasks = await db.getAllFromIndex('entries', 'by-entry_type', 'task');
  return tasks
    .filter((e) => !e.is_done)
    .sort((a, b) => {
      const priorityOrder: Record<Priority, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

export async function getOpenBlockers(): Promise<JournalEntry[]> {
  const db = await getDB();
  const blockers = await db.getAllFromIndex('entries', 'by-entry_type', 'blocker');
  return blockers
    .filter((e) => !e.is_done)
    .sort((a, b) => b.created_at - a.created_at);
}

export async function getExistingProjects(): Promise<string[]> {
  const entries = await getAllEntries();
  const projects = new Set<string>();
  for (const e of entries) {
    if (e.project) projects.add(e.project);
  }
  return [...projects];
}

export async function getTopTags(limit = 20): Promise<string[]> {
  const entries = await getAllEntries();
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const tag of e.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export async function clearAllEntries(): Promise<void> {
  const db = await getDB();
  await db.clear('entries');
}

export async function importEntries(entries: JournalEntry[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('entries', 'readwrite');
  await Promise.all([...entries.map((e) => tx.store.put(e)), tx.done]);
}
