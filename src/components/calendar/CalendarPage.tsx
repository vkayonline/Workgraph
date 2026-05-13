import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getEntriesInRange } from '../../lib/db/entries';
import { EntryCard } from '../entries/EntryCard';
import { EntryDetail } from '../entries/EntryDetail';
import type { JournalEntry } from '../../types';

const TYPE_COLOR_VAR: Record<string, string> = {
  work_log: 'var(--color-type-work-log)',
  decision: 'var(--color-type-decision)',
  problem: 'var(--color-type-problem)',
  solution: 'var(--color-type-solution)',
  meeting_note: 'var(--color-type-meeting)',
  task: 'var(--color-type-task)',
  learning: 'var(--color-type-learning)',
  blocker: 'var(--color-type-blocker)',
  risk: 'var(--color-type-risk)',
};

function isoDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthRange(year: number, month: number): { from: number; to: number } {
  const from = new Date(year, month, 1, 0, 0, 0, 0).getTime();
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
  return { from, to };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

export function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const { from, to } = monthRange(year, month);
    getEntriesInRange(from, to).then(setEntries);
  }, [year, month]);

  useEffect(() => {
    const handler = () => {
      const { from, to } = monthRange(year, month);
      getEntriesInRange(from, to).then(setEntries);
    };
    window.addEventListener('workgraph:entry-saved', handler);
    return () => window.removeEventListener('workgraph:entry-saved', handler);
  }, [year, month]);

  // Group entries by local date string
  const byDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const e of entries) {
      const key = isoDate(e.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const todayStr = useMemo(() => isoDate(Date.now()), []);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  }

  const dayEntries = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

  function handleUpdateEntry(updated: JournalEntry) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEntry((prev) => (prev?.id === updated.id ? updated : prev));
  }
  function handleDeleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelectedEntry(null);
  }

  return (
    <>
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors" aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors" aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-card border border-border rounded-md overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {/* Leading empty cells */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-border last:border-r-0 bg-faint/40" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEntries = byDate.get(dateStr) ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={[
                    'min-h-[72px] p-1.5 border-b border-r border-border last:border-r-0 text-left',
                    'transition-colors hover:bg-accent',
                    isSelected ? 'bg-accent ring-1 ring-inset ring-primary' : '',
                    (firstDow + i) % 7 === 6 ? 'border-r-0' : '',
                  ].join(' ')}
                >
                  <span className={[
                    'text-xs font-medium inline-flex items-center justify-center w-5 h-5 rounded-full',
                    isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                  ].join(' ')}>
                    {day}
                  </span>

                  {/* Entry dots */}
                  {dayEntries.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayEntries.slice(0, 6).map((e) => (
                        <span
                          key={e.id}
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: TYPE_COLOR_VAR[e.entry_type] ?? '#888' }}
                          title={e.entry_type}
                        />
                      ))}
                      {dayEntries.length > 6 && (
                        <span className="text-[9px] text-muted-foreground leading-none">+{dayEntries.length - 6}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        {selectedDate && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-foreground">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
              <span className="text-muted-foreground font-normal ml-2">
                {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
              </span>
            </h2>
            {dayEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries on this day.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {dayEntries.map((e) => (
                  <EntryCard key={e.id} entry={e} onClick={setSelectedEntry} onUpdate={handleUpdateEntry} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {Object.entries(TYPE_COLOR_VAR).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {type.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {selectedEntry && (
        <EntryDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdate={handleUpdateEntry}
          onDelete={handleDeleteEntry}
          onNavigate={setSelectedEntry}
        />
      )}
    </>
  );
}
