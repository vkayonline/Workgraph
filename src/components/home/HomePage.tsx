import { useEffect, useState, useCallback } from 'react';
import { Flame } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { JournalRepository, DATA_EVENTS } from '../../lib/db/repository';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { EntryCard } from '../entries/EntryCard';
import { EntryDetail } from '../entries/EntryDetail';
import { EmptyState } from '../shared/EmptyState';
import { SkeletonCard } from '../shared/Skeleton';
import { QuickLog } from './QuickLog';
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
  const { currentStreak, entriesThisWeek } = useDashboardStats();
  const [todayEntries, setTodayEntries] = useState<JournalEntry[]>([]);
  const [tasks, setTasks] = useState<JournalEntry[]>([]);
  const [issues, setIssues] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JournalEntry | null>(null);

  const load = useCallback(async () => {
    const [t, p, i] = await Promise.all([
      JournalRepository.getToday(),
      JournalRepository.getTasks(),
      JournalRepository.getIssues(),
    ]);
    setTodayEntries(t);
    setTasks(p);
    setIssues(i);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener(DATA_EVENTS.ENTRY_SAVED, handler);
    window.addEventListener(DATA_EVENTS.ENTRY_DELETED, handler);
    return () => {
      window.removeEventListener(DATA_EVENTS.ENTRY_SAVED, handler);
      window.removeEventListener(DATA_EVENTS.ENTRY_DELETED, handler);
    };
  }, [load]);

  function handleUpdate(updated: JournalEntry) {
    JournalRepository.save(updated);
    setSelected((prev) => (prev?.id === updated.id ? updated : prev));
  }

  function handleDelete(id: string) {
    JournalRepository.delete(id);
  }

  return (
    <>
    <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-24">
      {/* Greeting & Streak Hero */}
      <div className="relative overflow-hidden bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-start justify-between gap-4">
        <div className="relative z-10">
          <p className="text-primary/60 text-xs font-bold uppercase tracking-widest mb-1">{todayLabel()}</p>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {greeting(settings.userProfile.name)}
          </h1>
          {entriesThisWeek > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              You've captured <span className="text-foreground font-medium">{entriesThisWeek} {entriesThisWeek === 1 ? 'entry' : 'entries'}</span> this week.
            </p>
          )}
        </div>
        
        {currentStreak > 0 && (
          <div className="relative z-10 flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1.5 text-warning font-bold text-2xl">
              <Flame size={24} fill="currentColor" />
              {currentStreak}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
              Streak
            </p>
          </div>
        )}
        
        {/* Decorative background element */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tasks.length > 0 && (
          <section className="px-1">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Active Tasks
              </h2>
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {tasks.slice(0, 5).map((t) => (
                <EntryCard key={t.id} entry={t} onClick={setSelected} onUpdate={handleUpdate} />
              ))}
            </div>
          </section>
        )}

        {issues.length > 0 && (
          <section className="px-1">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                Open Issues
              </h2>
              <span className="text-[10px] font-medium bg-danger/10 text-danger px-2 py-0.5 rounded-full">{issues.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {issues.map((i) => (
                <EntryCard key={i.id} entry={i} onClick={setSelected} onUpdate={handleUpdate} />
              ))}
            </div>
          </section>
        )}

        <section className="px-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Today's Stream
            </h2>
            <span className="text-[10px] font-medium text-muted-foreground">{todayEntries.length} items</span>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : todayEntries.length === 0 ? (
            <EmptyState message="The stream is empty. Start typing below." />
          ) : (
            <div className="flex flex-col gap-2">
              {todayEntries.map((e) => (
                <EntryCard key={e.id} entry={e} onClick={setSelected} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-6 left-0 right-0 lg:left-56 z-20 pointer-events-none px-6 md:px-12 lg:px-6">
        <div className="max-w-2xl mx-auto w-full pointer-events-auto">
          <QuickLog />
        </div>
      </div>

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
