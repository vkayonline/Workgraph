import { 
  putEntry as dbPut, 
  deleteEntry as dbDelete, 
  toggleStar as dbToggleStar,
  getEntry as dbGet,
  getAllEntries as dbGetAll,
  getEntriesInRange as dbGetRange,
  getTodayEntries as dbGetToday,
  getPendingTasks as dbGetTasks,
  getOpenIssues as dbGetIssues
} from './entries';
import type { JournalEntry } from '../../types';

/**
 * Global event names for data synchronization
 */
export const DATA_EVENTS = {
  ENTRY_SAVED: 'workgraph:entry-saved',
  ENTRY_DELETED: 'workgraph:entry-deleted',
} as const;

/**
 * JournalRepository: Centralized access point for all journal data operations.
 * Enforces consistency and triggers synchronization events.
 */
export const JournalRepository = {
  async save(entry: JournalEntry): Promise<void> {
    await dbPut(entry);
    this.notify(DATA_EVENTS.ENTRY_SAVED, entry.id);
  },

  async delete(id: string): Promise<void> {
    await dbDelete(id);
    this.notify(DATA_EVENTS.ENTRY_DELETED, id);
  },

  async toggleStar(entry: JournalEntry): Promise<JournalEntry> {
    const updated = await dbToggleStar(entry);
    this.notify(DATA_EVENTS.ENTRY_SAVED, entry.id);
    return updated;
  },

  async get(id: string) { return dbGet(id); },
  async getAll() { return dbGetAll(); },
  async getRange(from: number, to: number) { return dbGetRange(from, to); },
  async getToday() { return dbGetToday(); },
  async getTasks() { return dbGetTasks(); },
  async getIssues() { return dbGetIssues(); },

  /**
   * Internal helper to broadcast state changes
   */
  notify(event: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  }
};
