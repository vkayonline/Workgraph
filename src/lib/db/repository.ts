import { 
  putEntry as dbPut, 
  deleteEntry as dbDelete, 
  toggleStar as dbToggleStar,
  getEntry as dbGet,
  getEntriesPaginated as dbGetPaginated,
  getEntriesInRange as dbGetRange,
  getTodayEntries as dbGetToday,
  getPendingTasks as dbGetTasks,
  getOpenIssues as dbGetIssues,
  putCommitment as dbPutCommitment,
  getCommitment as dbGetCommitment,
  getCommitmentsByStatus as dbGetCommitmentsByStatus,
  deleteCommitment as dbDeleteCommitment,
} from './entries';
import type { JournalEntry, Commitment, CommitmentStatus } from '../../types';

/**
 * Global event names for data synchronization
 */
export const DATA_EVENTS = {
  ENTRY_SAVED: 'recall:entry-saved',
  ENTRY_DELETED: 'recall:entry-deleted',
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
  async getPaginated(limit: number = 50, offset: number = 0) { return dbGetPaginated(limit, offset); },
  async getRange(from: number, to: number) { return dbGetRange(from, to); },
  async getToday() { return dbGetToday(); },
  async getTasks() { return dbGetTasks(); },
  async getIssues() { return dbGetIssues(); },

  async saveCommitment(commitment: Commitment): Promise<void> {
    await dbPutCommitment(commitment);
    this.notify(DATA_EVENTS.ENTRY_SAVED, commitment.id); // Re-using ENTRY_SAVED for now.
  },
  async getCommitment(id: string): Promise<Commitment | undefined> {
    return dbGetCommitment(id);
  },
  async getCommitmentsByStatus(status: CommitmentStatus): Promise<Commitment[]> {
    return dbGetCommitmentsByStatus(status);
  },
  async deleteCommitment(id: string): Promise<void> {
    await dbDeleteCommitment(id);
    this.notify(DATA_EVENTS.ENTRY_DELETED, id); // Re-using ENTRY_DELETED for now.
  },

  /**
   * Internal helper to broadcast state changes
   */
  notify(event: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  }
};
