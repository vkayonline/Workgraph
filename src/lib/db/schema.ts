import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { JournalEntry } from '../../types';

interface WorkGraphDB extends DBSchema {
  entries: {
    key: string;
    value: JournalEntry;
    indexes: {
      'by-created_at': number;
      'by-entry_type': string;
      'by-project': string;
      'by-priority': string;
      'by-is_done': number;
      'by-starred': number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<WorkGraphDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<WorkGraphDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WorkGraphDB>('workgraph', 2, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('entries', { keyPath: 'id' });
          store.createIndex('by-created_at', 'created_at');
          store.createIndex('by-entry_type', 'entry_type');
          store.createIndex('by-project', 'project');
          store.createIndex('by-priority', 'priority');
          store.createIndex('by-is_done', 'is_done');
          store.createIndex('by-starred', 'starred');
        }
        if (oldVersion >= 1 && oldVersion < 2) {
          // Add by-starred index and backfill links/starred fields on existing entries
          const store = transaction.objectStore('entries');
          store.createIndex('by-starred', 'starred');
          let cursor = await store.openCursor();
          while (cursor) {
            const val = cursor.value as JournalEntry & { links?: string[]; starred?: boolean };
            const patched: JournalEntry = {
              ...val,
              links: val.links ?? [],
              starred: val.starred ?? false,
            };
            await cursor.update(patched);
            cursor = await cursor.continue();
          }
        }
      },
    });
  }
  return dbPromise;
}
