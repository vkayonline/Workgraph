import { useState, useEffect, useMemo } from 'react';
import { getEntriesInRange } from '../../lib/db/entries';
import { EntryTypeChart } from './EntryTypeChart';
import { TagCloud } from './TagCloud';
import { SentimentChart } from './SentimentChart';
import { TimeLogChart } from './TimeLogChart';
import { WeeklyReviewCard } from './WeeklyReviewCard';
import type { JournalEntry } from '../../types';

type RangePreset = '7d' | '30d' | '90d' | 'custom';

function rangeFromPreset(preset: Exclude<RangePreset, 'custom'>): { from: number; to: number } {
  const to = Date.now();
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  return { from: to - days * 86400000, to };
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

  const { from, to } = useMemo(() => {
    if (preset === 'custom' && customFrom && customTo) {
      return {
        from: new Date(customFrom + 'T00:00:00').getTime(),
        to: new Date(customTo + 'T23:59:59').getTime(),
      };
    }
    if (preset !== 'custom') return rangeFromPreset(preset);
    return { from: Date.now() - 30 * 86400000, to: Date.now() };
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    getEntriesInRange(from, to).then(setEntries);
  }, [from, to]);

  useEffect(() => {
    const handler = () => getEntriesInRange(from, to).then(setEntries);
    window.addEventListener('workgraph:entry-saved', handler);
    return () => window.removeEventListener('workgraph:entry-saved', handler);
  }, [from, to]);

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
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold text-foreground">Insights</h1>

        {/* Range selector */}
        <div className="flex items-center flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={[
                'px-3 py-1 text-xs rounded-full border transition-colors',
                preset === p.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-accent',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="flex items-center gap-2 mt-1 w-full">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2 py-1 text-xs border border-input rounded-md bg-background text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2 py-1 text-xs border border-input rounded-md bg-background text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0"
              />
            </div>
          )}
        </div>

        {/* Summary row */}
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{entries.length}</span> entries
          </span>
          {totalDuration > 0 && (
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">
                {Math.round(totalDuration / 60 * 10) / 10}h
              </span>{' '}
              logged
            </span>
          )}
        </div>
      </div>

      {/* Entry type distribution */}
      <section className="bg-card border border-border rounded-md p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Entry types
        </h2>
        <EntryTypeChart entries={entries} />
      </section>

      {/* Sentiment over time */}
      <section className="bg-card border border-border rounded-md p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Sentiment over time
        </h2>
        <SentimentChart entries={entries} />
      </section>

      {/* Time logged */}
      <section className="bg-card border border-border rounded-md p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Time logged (work logs)
        </h2>
        <TimeLogChart entries={entries} />
      </section>

      {/* Tag cloud */}
      <section className="bg-card border border-border rounded-md p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Top tags
        </h2>
        <TagCloud entries={entries} />
      </section>

      {/* Weekly review */}
      <section className="bg-card border border-border rounded-md p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          AI summary
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
