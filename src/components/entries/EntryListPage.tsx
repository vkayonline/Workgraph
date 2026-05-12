import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { EntryCard } from './EntryCard';
import { EntryDetail } from './EntryDetail';
import { EmptyState } from '../shared/EmptyState';
import { SkeletonCard } from '../shared/Skeleton';
import type { EntryType, JournalEntry } from '../../types';
import { ENTRY_TYPES } from '../../types';

const TYPE_LABELS: Record<EntryType, string> = {
  work_log: 'Work log', decision: 'Decision', problem: 'Problem',
  solution: 'Solution', meeting_note: 'Meeting', task: 'Task',
  learning: 'Learning', blocker: 'Blocker', risk: 'Risk',
};

const filterBtnClass = (active: boolean) =>
  [
    'px-3 py-1 text-xs rounded-full border transition-colors',
    active
      ? 'bg-primary text-primary-foreground border-primary'
      : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
  ].join(' ');

export function EntryListPage() {
  const { entries, loading, update, remove } = useEntries();
  const [filterType, setFilterType] = useState<EntryType | 'all'>('all');
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const filtered =
    filterType === 'all' ? entries : entries.filter((e) => e.entry_type === filterType);

  return (
    <>
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Entries</h1>
          <span className="text-sm text-muted-foreground">{filtered.length}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={filterBtnClass(filterType === 'all')} onClick={() => setFilterType('all')}>
            All
          </button>
          {ENTRY_TYPES.map((type) => (
            <button
              key={type}
              className={filterBtnClass(filterType === type)}
              onClick={() => setFilterType(type)}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message={filterType === 'all' ? 'No entries yet.' : 'No entries match these filters.'}
            cta={
              filterType !== 'all' && (
                <button
                  onClick={() => setFilterType('all')}
                  className="text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((e) => (
              <EntryCard key={e.id} entry={e} onClick={setSelected} onUpdate={update} />
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
        />
      )}
    </>
  );
}
