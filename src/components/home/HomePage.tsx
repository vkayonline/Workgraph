import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { getTodayEntries, getPendingTasks, getOpenBlockers } from '../../lib/db/entries';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { EntryCard } from '../entries/EntryCard';
import { EntryDetail } from '../entries/EntryDetail';
import { EmptyState } from '../shared/EmptyState';
import { SkeletonCard } from '../shared/Skeleton';
import type { JournalEntry } from '../../types';

function greeting(name: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export function HomePage() {
  const { settings } = useSettingsContext();
  const { currentStreak, longestStreak, entriesThisWeek } = useDashboardStats();
  const [todayEntries, setTodayEntries] = useState<JournalEntry[]>([]);
  const [tasks, setTasks] = useState<JournalEntry[]>([]);
  const [blockers, setBlockers] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  async function load() {
    const [t, p, b] = await Promise.all([
      getTodayEntries(),
      getPendingTasks(),
      getOpenBlockers(),
    ]);
    setTodayEntries(t);
    setTasks(p);
    setBlockers(b);
    setLoading(false);
  }

  useEffect(() => {
    load();
    window.addEventListener('workgraph:entry-saved', load);
    return () => window.removeEventListener('workgraph:entry-saved', load);
  }, []);

  function handleUpdate(updated: JournalEntry) {
    setTodayEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setTasks((prev) =>
      updated.is_done
        ? prev.filter((e) => e.id !== updated.id)
        : prev.map((e) => (e.id === updated.id ? updated : e))
    );
    setSelected((prev) => (prev?.id === updated.id ? updated : prev));
  }

  function handleDelete(id: string) {
    setTodayEntries((prev) => prev.filter((e) => e.id !== id));
    setTasks((prev) => prev.filter((e) => e.id !== id));
    setBlockers((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <>
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{todayLabel()}</p>
          <h1 className="text-2xl font-semibold text-foreground mt-0.5">
            {greeting(settings.userProfile.name)}
          </h1>
        </div>
        {currentStreak > 0 && (
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-warning font-semibold text-lg">
              <Flame size={18} />
              {currentStreak}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 1 ? '1 day streak' : `${currentStreak} day streak`}
            </p>
            {longestStreak > currentStreak && (
              <p className="text-xs text-muted-foreground">best: {longestStreak}</p>
            )}
          </div>
        )}
      </div>

      {entriesThisWeek > 0 && (
        <p className="text-xs text-muted-foreground -mt-4">
          {entriesThisWeek} {entriesThisWeek === 1 ? 'entry' : 'entries'} this week
        </p>
      )}

      {tasks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pending Tasks
            </h2>
            <span className="text-xs text-muted-foreground">{tasks.length} open</span>
          </div>
          <div className="flex flex-col gap-2">
            {tasks.slice(0, 5).map((t) => (
              <EntryCard key={t.id} entry={t} onClick={setSelected} onUpdate={handleUpdate} />
            ))}
          </div>
        </section>
      )}

      {blockers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Open Blockers
            </h2>
            <span className="text-xs text-muted-foreground">{blockers.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {blockers.map((b) => (
              <EntryCard key={b.id} entry={b} onClick={setSelected} onUpdate={handleUpdate} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Today
          </h2>
          <span className="text-xs text-muted-foreground">{todayEntries.length} entries</span>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : todayEntries.length === 0 ? (
          <EmptyState message="Nothing captured yet today. What's on your mind?" />
        ) : (
          <div className="flex flex-col gap-2">
            {todayEntries.map((e) => (
              <EntryCard key={e.id} entry={e} onClick={setSelected} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </section>
    </div>

    {selected && (
      <EntryDetail
        entry={selected}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    )}
  </>
  );
}
