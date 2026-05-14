import { useState, useEffect, useMemo } from 'react';
import { Star, Search as SearchIcon, Filter, X, Calendar } from 'lucide-react';
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

function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatDateHeader(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function EntryListPage() {
  const { entries, loading, update, remove, refresh } = useEntries();
  const [filterType, setFilterType] = useState<EntryType | 'all'>('all');
  const [starredOnly, setStarredOnly] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
        const hay = [e.raw_text].join(' ').toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, filterType, starredOnly, debouncedQuery]);

  const groupedEntries = useMemo(() => {
    const dayGroups: { date: string; sessions: { id: string; items: JournalEntry[] }[] }[] = [];
    
    const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);

    sorted.forEach(entry => {
      const dateHeader = formatDateHeader(entry.timestamp);
      let dayGroup = dayGroups.find(g => g.date === dateHeader);
      
      if (!dayGroup) {
        dayGroup = { date: dateHeader, sessions: [] };
        dayGroups.push(dayGroup);
      }

      const SESSION_GAP_MS = 90 * 60 * 1000;
      let targetSession = dayGroup.sessions.find(s => {
        const lastEntry = s.items[0];
        const timeDiff = Math.abs(lastEntry.timestamp - entry.timestamp);
        return timeDiff < SESSION_GAP_MS;
      });

      if (targetSession) {
        targetSession.items.push(entry);
        targetSession.items.sort((a, b) => b.timestamp - a.timestamp);
      } else {
        dayGroup.sessions.push({
          id: `session-${entry.id}`,
          items: [entry]
        });
      }
    });

    return dayGroups;
  }, [filtered]);

  return (
    <>
      <div className="max-w-3xl mx-auto pb-20">
        {/* Header Area */}
        <div className="sticky top-0 z-10 bg-faint/80 backdrop-blur-md py-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Timeline</h1>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {filtered.length} operations logged
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-2 rounded-lg transition-colors ${isFilterOpen ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search operational memory..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Expanded Filters */}
          {isFilterOpen && (
            <div className="mt-3 p-4 bg-card border border-border/50 rounded-xl shadow-xl animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${filterType === 'all' ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  All Activity
                </button>
                {ENTRY_TYPES.map((type) => (
                  <button 
                    key={type} 
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${filterType === type ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
                <button
                  onClick={() => setStarredOnly((v) => !v)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center gap-1.5 ${starredOnly ? 'bg-warning border-warning text-warning-foreground' : 'bg-background border-border text-muted-foreground hover:border-warning/50'}`}
                >
                  <Star size={12} fill={starredOnly ? 'currentColor' : 'none'} /> Starred Only
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Content */}
        {loading ? (
          <div className="flex flex-col gap-4">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message={query ? 'No memories match your search.' : 'The timeline is silent. Time to log some work?'}
            cta={
              (query || filterType !== 'all' || starredOnly) && (
                <button onClick={() => { setQuery(''); setFilterType('all'); setStarredOnly(false); }}
                  className="text-sm text-primary hover:underline">
                  Clear all filters
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-12 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[21px] top-2 bottom-0 w-px bg-border/40 hidden sm:block" />

            {groupedEntries.map((group) => (
              <section key={group.date} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="hidden sm:flex w-11 h-11 items-center justify-center rounded-full bg-background border border-border z-10 shrink-0 shadow-sm">
                    <Calendar size={18} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest bg-faint pr-4">
                    {group.date}
                  </h3>
                </div>

                <div className="space-y-8 sm:ml-14">
                  {group.sessions.map((session) => (
                    <div key={session.id} className="relative group/session">
                      {/* Session Metadata / Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-0.5 rounded bg-muted/50 border border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {session.items.length} {session.items.length === 1 ? 'Event' : 'Events'}
                        </div>
                        <div className="h-px flex-1 bg-border/30" />
                        <span className="text-[10px] font-mono text-muted-foreground/40">
                          {new Date(session.items[session.items.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                          {' - '}
                          {new Date(session.items[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Session Items */}
                      <div className="space-y-3 pl-4 border-l-2 border-primary/10 group-hover/session:border-primary/30 transition-colors">
                        {session.items.map((e) => (
                          <EntryCard 
                            key={e.id} 
                            entry={e} 
                            onClick={setSelected} 
                            onUpdate={update}
                            highlight={debouncedQuery} 
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
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
