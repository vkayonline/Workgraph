// import { importEntries } from '../db/entries';
export async function importFromJSON(file: File): Promise<number> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('Invalid export file — expected an array of entries.');
  // await importEntries(data as JournalEntry[]);
  throw new Error("Import temporarily disabled due to schema migration.");
  return data.length;
}
