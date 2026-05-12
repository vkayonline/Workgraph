import type { JournalEntry } from '../../types';

interface TagCloudProps {
  entries: JournalEntry[];
}

export function TagCloud({ entries }: TagCloudProps) {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const tag of e.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No tags in range.</p>;
  }

  const max = Math.max(...counts.values());
  const tags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  function fontSize(count: number): string {
    const ratio = count / max;
    if (ratio > 0.75) return '1.125rem';
    if (ratio > 0.5) return '0.9375rem';
    if (ratio > 0.25) return '0.8125rem';
    return '0.75rem';
  }

  function opacity(count: number): number {
    return 0.5 + 0.5 * (count / max);
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center py-2">
      {tags.map(([tag, count]) => (
        <span
          key={tag}
          title={`${count} ${count === 1 ? 'entry' : 'entries'}`}
          style={{ fontSize: fontSize(count), opacity: opacity(count) }}
          className="text-primary font-medium cursor-default select-none"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
