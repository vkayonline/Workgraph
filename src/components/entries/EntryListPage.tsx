import { useState, useEffect, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useEntries } from '../../hooks/useEntries';
import { EntryCard } from './EntryCard';
import { EntryDetail } from './EntryDetail';
import { EmptyState } from '../shared/EmptyState';
import { SkeletonCard } from '../shared/Skeleton';
import { DATA_EVENTS } from '../../lib/db/repository';
import type { EntryType, JournalEntry } from '../../types';
import { ENTRY_TYPES } from '../../types';

const TYPE_LABELS: Record<EntryType, string> = {
  work_log: 'Work log', decision: 'Decision', issue: 'Issue',
  solution: 'Solution', meeting_note: 'Meeting', task: 'Task',
  learning: 'Learning',
};

const filterBtnClass = (active: boolean) =>
  [
    'px-3 py-1 text-xs rounded-full border transition-colors',
    active
      ? 'bg-primary text-primary-foreground border-primary'
      : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
  ].join(' ');

function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function EntryListPage() {
  const { entries, loading, update, remove, refresh } = useEntries();
  const [filterType, setFilterType] = useState<EntryType | 'all'>('all');
  const [starredOnly, setStarredOnly] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(DATA_EVENTS.ENTRY_SAVED, handler);
    window.addEventListener(DATA_EVENTS.ENTRY_DELETED, handler);
    return () => {
      window.removeEventListener(DATA_EVENTS.ENTRY_SAVED, handler);
      window.removeEventListener(DATA_EVENTS.ENTRY_DELETED, handler);
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    let list = filterType === 'all' ? entries : entries.filter((e) => e.entry_type === filterType);
    if (starredOnly) list = list.filter((e) => e.starred);
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      const terms = q.split(/\s+/);
      list = list.filter((e) => {
        const hay = [e.raw_text, ...e.tags, e.project ?? ''].join(' ').toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }
    return list;
  }, [entries, filterType, starredOnly, debouncedQuery]);

  return (
    <>
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Entries</h1>
          <span className="text-sm text-muted-foreground">{filtered.length}</span>
        </div>

        {/* Search */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entries…"
          className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0 font-mono"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button className={filterBtnClass(filterType === 'all')} onClick={() => setFilterType('all')}>All</button>
          {ENTRY_TYPES.map((type) => (
            <button key={type} className={filterBtnClass(filterType === type)} onClick={() => setFilterType(type)}>
              {TYPE_LABELS[type]}
            </button>
          ))}
          <button
            onClick={() => setStarredOnly((v) => !v)}
            className={[
              'px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1',
              starredOnly
                ? 'bg-warning text-background border-warning'
                : 'border-border text-muted-foreground hover:border-warning hover:text-warning',
            ].join(' ')}
            aria-pressed={starredOnly}
          >
            <Star size={11} fill={starredOnly ? 'currentColor' : 'none'} /> Starred
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message={query ? 'No entries match your search.' : filterType !== 'all' || starredOnly ? 'No entries match these filters.' : 'No entries yet.'}
            cta={
              (query || filterType !== 'all' || starredOnly) && (
                <button onClick={() => { setQuery(''); setFilterType('all'); setStarredOnly(false); }}
                  className="text-sm text-primary hover:underline">
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((e) => (
              <EntryCard key={e.id} entry={e} onClick={setSelected} onUpdate={update}
                highlight={debouncedQuery} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <EntryDetail
          entry={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => { update(updated); setSelected(updated); }}
          onDelete={(id) => { remove(id); setSelected(null); }}
          onNavigate={(e) => setSelected(e)}
        />
      )}
    </>
  );
}
