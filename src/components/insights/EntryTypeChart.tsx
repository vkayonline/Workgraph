import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { JournalEntry } from '../../types';

const TYPE_COLORS: Record<string, string> = {
  work_log:     'var(--color-type-work-log)',
  decision:     'var(--color-type-decision)',
  problem:      'var(--color-type-problem)',
  solution:     'var(--color-type-solution)',
  meeting_note: 'var(--color-type-meeting)',
  task:         'var(--color-type-task)',
  learning:     'var(--color-type-learning)',
  blocker:      'var(--color-type-blocker)',
  risk:         'var(--color-type-risk)',
};

interface EntryTypeChartProps {
  entries: JournalEntry[];
}

export function EntryTypeChart({ entries }: EntryTypeChartProps) {
  const counts = new Map<string, number>();
  for (const e of entries) {
    counts.set(e.entry_type, (counts.get(e.entry_type) ?? 0) + 1);
  }

  const data = [...counts.entries()]
    .map(([type, count]) => ({ name: type.replace('_', ' '), type, count }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No entries in range.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.type} fill={TYPE_COLORS[d.type] ?? '#888'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--color-foreground)',
          }}
          formatter={(value, name) => [value as number, name as string]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', color: 'var(--color-muted-fg)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
