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
    };
  };
}

let dbPromise: Promise<IDBPDatabase<WorkGraphDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<WorkGraphDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WorkGraphDB>('workgraph', 1, {
      upgrade(db) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('by-created_at', 'created_at');
        store.createIndex('by-entry_type', 'entry_type');
        store.createIndex('by-project', 'project');
        store.createIndex('by-priority', 'priority');
        store.createIndex('by-is_done', 'is_done');
      },
    });
  }
  return dbPromise;
}
