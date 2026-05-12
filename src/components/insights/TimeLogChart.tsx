import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { JournalEntry } from '../../types';

interface TimeLogChartProps {
  entries: JournalEntry[];
}

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TimeLogChart({ entries }: TimeLogChartProps) {
  const workLogs = entries.filter(
    (e) => e.entry_type === 'work_log' && typeof e.duration_minutes === 'number' && e.duration_minutes > 0
  );

  if (workLogs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No work log entries with duration in range.
      </p>
    );
  }

  const byDay = new Map<string, number>();
  for (const e of workLogs) {
    const day = toLocalDateStr(e.created_at);
    byDay.set(day, (byDay.get(day) ?? 0) + (e.duration_minutes ?? 0));
  }

  const data = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, minutes]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      hours: Math.round((minutes / 60) * 10) / 10,
    }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-fg)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-fg)' }} unit="h" />
        <Tooltip
          contentStyle={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--color-foreground)',
          }}
          formatter={(v) => [`${v as number}h`, 'Logged time']}
        />
        <Bar dataKey="hours" fill="var(--color-type-work-log)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
