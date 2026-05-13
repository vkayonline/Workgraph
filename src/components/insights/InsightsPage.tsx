import { useState, useEffect, useMemo, useCallback } from 'react';
import { JournalRepository, DATA_EVENTS } from '../../lib/db/repository';
import { EntryTypeChart } from './EntryTypeChart';
import { TagCloud } from './TagCloud';
import { ImpactChart } from './ImpactChart';
import { TimeLogChart } from './TimeLogChart';
import { WeeklyReviewCard } from './WeeklyReviewCard';
import type { JournalEntry } from '../../types';

type RangePreset = '7d' | '30d' | '90d' | 'custom';

function rangeFromPreset(preset: Exclude<RangePreset, 'custom'>, now: number): { from: number; to: number } {
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  return { from: now - days * 86400000, to: now };
}

function toIsoDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function InsightsPage() {
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const baseNow = useMemo(() => Date.now(), []);

  const { from, to } = useMemo(() => {
    if (preset === 'custom' && customFrom && customTo) {
      return {
        from: new Date(customFrom + 'T00:00:00').getTime(),
        to: new Date(customTo + 'T23:59:59').getTime(),
      };
    }
    if (preset !== 'custom') return rangeFromPreset(preset, baseNow);
    return { from: baseNow - 30 * 86400000, to: baseNow };
  }, [preset, customFrom, customTo, baseNow]);

  const load = useCallback(async () => {
    const data = await JournalRepository.getRange(from, to);
    setEntries(data);
  }, [from, to]);

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

  const startDateStr = toIsoDate(from);
  const endDateStr = toIsoDate(to);

  const totalDuration = useMemo(
    () => entries.filter((e) => e.entry_type === 'work_log' && e.duration_minutes)
      .reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0),
    [entries]
  );

  const PRESETS: { value: RangePreset; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Insights</h1>
          {/* Range selector */}
          <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-lg">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={[
                  'px-3 py-1 text-xs font-medium rounded-md transition-all',
                  preset === p.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 justify-end animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1 text-xs border border-input rounded-md bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1 text-xs border border-input rounded-md bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Entries</p>
          <p className="text-2xl font-semibold tabular-nums">{entries.length}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Time Logged</p>
          <p className="text-2xl font-semibold tabular-nums">
            {Math.round(totalDuration / 60 * 10) / 10}<span className="text-sm font-normal text-muted-foreground ml-1">h</span>
          </p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Decisions</p>
          <p className="text-2xl font-semibold tabular-nums">{entries.filter(e => e.entry_type === 'decision').length}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Issues</p>
          <p className="text-2xl font-semibold tabular-nums text-danger">{entries.filter(e => e.entry_type === 'issue').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entry type distribution */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full" />
            Distribution by Type
          </h2>
          <EntryTypeChart entries={entries} />
        </section>

        {/* Impact over time */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-danger rounded-full" />
            Impact Over Time
          </h2>
          <ImpactChart entries={entries} />
        </section>

        {/* Time logged */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
            Work Velocity
          </h2>
          <TimeLogChart entries={entries} />
        </section>

        {/* Tag cloud */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-zinc-400 rounded-full" />
            Context Cloud
          </h2>
          <TagCloud entries={entries} />
        </section>
      </div>

      {/* Weekly review - Full width */}
      <section className="bg-card border border-border rounded-xl p-6 shadow-sm border-t-4 border-t-primary/20">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary rounded-full" />
          AI Synthesis
        </h2>
        <WeeklyReviewCard
          entries={entries}
          startDate={startDateStr}
          endDate={endDateStr}
        />
      </section>
    </div>
  );
}
