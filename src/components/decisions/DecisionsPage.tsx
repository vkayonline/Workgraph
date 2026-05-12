import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useEntries } from '../../hooks/useEntries';
import { EntryCard } from '../entries/EntryCard';
import { EntryDetail } from '../entries/EntryDetail';
import { EmptyState } from '../shared/EmptyState';
import { SkeletonCard } from '../shared/Skeleton';
import type { JournalEntry } from '../../types';

function monthLabel(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function DecisionsPage() {
  const { entries, loading, update, remove } = useEntries();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const decisions = useMemo(() => {
    const all = entries.filter((e) => e.entry_type === 'decision');
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (e) =>
        e.raw_text.toLowerCase().includes(q) ||
        e.tags.some((t) => t.includes(q)) ||
        (e.project?.toLowerCase().includes(q) ?? false)
    );
  }, [entries, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof decisions>();
    for (const d of decisions) {
      const key = monthLabel(d.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return [...map.entries()];
  }, [decisions]);

  return (
    <>
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-foreground">Decisions</h1>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0"
          />
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : grouped.length === 0 ? (
          <EmptyState message="No decisions logged yet." />
        ) : (
          grouped.map(([month, items]) => (
            <section key={month}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {month}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((e) => (
                  <EntryCard key={e.id} entry={e} onClick={setSelected} onUpdate={update} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {selected && (
        <EntryDetail
          entry={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => { update(updated); setSelected(updated); }}
          onDelete={(id) => { remove(id); setSelected(null); }}
        />
      )}
    </>
  );
}
