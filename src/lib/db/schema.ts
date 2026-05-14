import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { JournalEntry, Session, Edge, Project, Tag, EntryTag, Attachment, Commitment, OperationalGravity } from '../../types';

interface RecallDB extends DBSchema {
  entries: {
    key: string;
    value: JournalEntry;
    indexes: {
      'by-created_at': number;
      'by-entry_type': string;
      'by-project_id': string;
      'by-session_id': string;
      'by-operational_gravity': number;
      'by-is_done': number;
      'by-starred': number;
      'by-classification_status': string;
      'by-embedding_status': string;
    };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: {
      'by-project_id': string;
      'by-start_time': number;
      'by-status': string;
    };
  };
  edges: {
    key: string;
    value: Edge;
    indexes: {
      'by-source': string;
      'by-target': string;
      'by-type': string;
    };
  };
  projects: {
    key: string;
    value: Project;
    indexes: {
      'by-name': string;
      'by-status': string;
    };
  };
  tags: {
    key: string;
    value: Tag;
    indexes: {
      'by-name': string;
    };
  };
  entry_tags: {
    key: [string, string];
    value: EntryTag;
    indexes: {
      'by-entry': string;
      'by-tag': string;
    };
  };
  attachments: {
    key: string;
    value: Attachment;
    indexes: {
      'by-entry': string;
    };
  };
  commitments: {
    key: string;
    value: Commitment;
    indexes: {
      'by-status': string;
      'by-due_at': number;
      'by-operational_gravity': number;
      'by-related_session': string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<RecallDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<RecallDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RecallDB>('recall', 5, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('entries', { keyPath: 'id' });
          store.createIndex('by-created_at', 'created_at');
          store.createIndex('by-entry_type', 'entry_type');
          store.createIndex('by-project' as any, 'project'); // Dropped in v4
          store.createIndex('by-operational_gravity', 'operational_gravity');
          store.createIndex('by-is_done', 'is_done');
          store.createIndex('by-starred', 'starred');
        }
        if (oldVersion >= 1 && oldVersion < 2) {
          const store = transaction.objectStore('entries');
          store.createIndex('by-starred', 'starred');
          let cursor = await store.openCursor();
          while (cursor) {
            const val = cursor.value as any;
            const patched = {
              ...val,
              links: val.links ?? [],
              starred: val.starred ?? false,
              classification_status: 'processed',
              embedding_status: val.embedding_vector ? 'processed' : 'pending'
            };
            await cursor.update(patched);
            cursor = await cursor.continue();
          }
        }
        if (oldVersion >= 2 && oldVersion < 3) {
          const store = transaction.objectStore('entries');
          if (!store.indexNames.contains('by-classification_status')) {
            store.createIndex('by-classification_status', 'classification_status');
          }
          if (!store.indexNames.contains('by-embedding_status')) {
            store.createIndex('by-embedding_status', 'embedding_status');
          }
          let cursor = await store.openCursor();
          while (cursor) {
            const val = cursor.value as any;
            if (val.classification_status === undefined || val.embedding_status === undefined) {
              const patched = {
                ...val,
                classification_status: val.classification_status ?? 'processed',
                embedding_status: val.embedding_status ?? (val.embedding_vector ? 'processed' : 'pending'),
              };
              await cursor.update(patched);
            }
            cursor = await cursor.continue();
          }
        }
        if (oldVersion < 4) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('by-project_id', 'project_id');
          sessionsStore.createIndex('by-start_time', 'start_time');
          sessionsStore.createIndex('by-status', 'status');

          const edgesStore = db.createObjectStore('edges', { keyPath: 'id' });
          edgesStore.createIndex('by-source', 'source_id');
          edgesStore.createIndex('by-target', 'target_id');
          edgesStore.createIndex('by-type', 'edge_type');

          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectsStore.createIndex('by-name', 'name');
          projectsStore.createIndex('by-status', 'status');

          const tagsStore = db.createObjectStore('tags', { keyPath: 'id' });
          tagsStore.createIndex('by-name', 'name');

          const entryTagsStore = db.createObjectStore('entry_tags', { keyPath: ['entry_id', 'tag_id'] });
          entryTagsStore.createIndex('by-entry', 'entry_id');
          entryTagsStore.createIndex('by-tag', 'tag_id');

          const attachmentsStore = db.createObjectStore('attachments', { keyPath: 'id' });
          attachmentsStore.createIndex('by-entry', 'entry_id');

          const entriesStore = transaction.objectStore('entries');
          
          if (entriesStore.indexNames.contains('by-project' as any)) {
            entriesStore.deleteIndex('by-project' as any);
          }
          
          entriesStore.createIndex('by-project_id', 'project_id');
          entriesStore.createIndex('by-session_id', 'session_id');

          // Migration logic
          const allEntries: any[] = [];
          let cursor = await entriesStore.openCursor();
          while (cursor) {
            allEntries.push(cursor.value);
            cursor = await cursor.continue();
          }
          
          // Sort chronologically for session computation
          allEntries.sort((a, b) => a.timestamp - b.timestamp);

          const projectMap = new Map<string, string>();
          const tagMap = new Map<string, string>();
          const generateId = () => crypto.randomUUID();

          let currentSession: Session | null = null;
          let lastEntryTime = 0;
          const SESSION_GAP_MS = 90 * 60 * 1000;

          for (const oldEntry of allEntries) {
            let project_id = null;
            if (oldEntry.project) {
              if (!projectMap.has(oldEntry.project)) {
                const newId = generateId();
                projectMap.set(oldEntry.project, newId);
                await projectsStore.put({
                  id: newId,
                  name: oldEntry.project,
                  description: null,
                  created_at: oldEntry.timestamp,
                  status: 'active'
                });
              }
              project_id = projectMap.get(oldEntry.project) || null;
            }

            if (oldEntry.tags) {
              for (const tagName of oldEntry.tags) {
                if (!tagMap.has(tagName)) {
                  const newId = generateId();
                  tagMap.set(tagName, newId);
                  await tagsStore.put({
                    id: newId,
                    name: tagName,
                    color: null
                  });
                }
                await entryTagsStore.put({
                  entry_id: oldEntry.id,
                  tag_id: tagMap.get(tagName)!
                });
              }
            }

            if (oldEntry.images) {
              for (const img of oldEntry.images) {
                await attachmentsStore.put({
                  id: img.id,
                  entry_id: oldEntry.id,
                  mime_type: img.mime_type,
                  data_url: img.data_url,
                  file_name: img.file_name,
                  created_at: oldEntry.timestamp
                });
              }
            }

            if (oldEntry.links) {
              for (const target of oldEntry.links) {
                await edgesStore.put({
                  id: generateId(),
                  source_id: oldEntry.id,
                  target_id: target,
                  edge_type: 'references',
                  timestamp: oldEntry.timestamp
                });
              }
            }

            const timeDiff = oldEntry.timestamp - lastEntryTime;
            
            if (!currentSession || timeDiff >= SESSION_GAP_MS || currentSession.project_id !== project_id) {
              if (currentSession) {
                await sessionsStore.put(currentSession);
              }
              currentSession = {
                id: `session-${oldEntry.id}`,
                project_id: project_id,
                start_time: oldEntry.timestamp,
                end_time: oldEntry.timestamp,
                summary: null,
                status: 'completed',
                created_at: oldEntry.timestamp
              };
            } else {
              currentSession.end_time = oldEntry.timestamp;
            }
            
            lastEntryTime = oldEntry.timestamp;

            const priorityMap: Record<string, OperationalGravity> = {
              critical: 1.0,
              high: 0.75,
              medium: 0.5,
              low: 0.25,
            };

            const updatedEntry: JournalEntry = {
              id: oldEntry.id,
              created_at: oldEntry.created_at,
              timestamp: oldEntry.timestamp,
              raw_text: oldEntry.raw_text,
              entry_type: oldEntry.entry_type,
              operational_gravity: priorityMap[oldEntry.priority as string] ?? 0.5, // Default to medium
              is_done: oldEntry.is_done,
              duration_minutes: oldEntry.duration_minutes ?? null,
              starred: oldEntry.starred ?? false,
              embedding_vector: oldEntry.embedding_vector ?? null,
              classification_status: oldEntry.classification_status ?? 'processed',
              embedding_status: oldEntry.embedding_status ?? 'processed',
              processing_metadata: oldEntry.processing_metadata,
              project_id: project_id,
              session_id: currentSession.id
            };
            
            await entriesStore.put(updatedEntry as any);
          }
          if (currentSession) {
            await sessionsStore.put(currentSession);
          }
        }
        if (oldVersion < 5) {
          const commitmentsStore = db.createObjectStore('commitments', { keyPath: 'id' });
          commitmentsStore.createIndex('by-status', 'status');
          commitmentsStore.createIndex('by-due_at', 'due_at');
          commitmentsStore.createIndex('by-operational_gravity', 'operational_gravity');
          commitmentsStore.createIndex('by-related_session', 'related_session_id');
        }
      },
    });
  }
  return dbPromise;
}
