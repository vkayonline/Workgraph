import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { JournalEntry } from '../../types';

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'var(--color-priority-critical)',
  high:     'var(--color-priority-high)',
  medium:   'var(--color-priority-medium)',
  low:      'var(--color-priority-low)',
};

interface ImpactChartProps {
  entries: JournalEntry[];
}

function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ImpactChart({ entries }: ImpactChartProps) {
  // Group by day
  const byDay = new Map<string, Record<string, number>>();
  for (const e of entries) {
    const day = toLocalDateStr(e.created_at);
    if (!byDay.has(day)) byDay.set(day, { critical: 0, high: 0, medium: 0, low: 0 });
    byDay.get(day)![e.priority] = (byDay.get(day)![e.priority] ?? 0) + 1;
  }

  const data = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, counts]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      ...counts,
    }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No entries in range.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-fg)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-fg)' }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--color-foreground)',
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
        {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
          <Bar
            key={p}
            dataKey={p}
            stackId="1"
            fill={PRIORITY_COLORS[p]}
            radius={[0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
