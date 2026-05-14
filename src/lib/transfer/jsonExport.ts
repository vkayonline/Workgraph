import { getEntriesPaginated } from '../db/entries';

export async function exportToJSON(): Promise<void> {
  const entries = await getEntriesPaginated(99999, 0); // Fetch all for export
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recall-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
