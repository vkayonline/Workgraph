import { importEntries } from '../db/entries';
import type { JournalEntry } from '../../types';

export async function importFromJSON(file: File): Promise<number> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('Invalid export file — expected an array of entries.');
  await importEntries(data as JournalEntry[]);
  return data.length;
}
