import type { Priority } from '../../types';

interface PriorityDotProps {
  priority: Priority;
  showLabel?: boolean;
}

const COLOR: Record<Priority, string> = {
  low: 'var(--color-priority-low)',
  medium: 'var(--color-priority-medium)',
  high: 'var(--color-priority-high)',
  critical: 'var(--color-priority-critical)',
};

export function PriorityDot({ priority, showLabel = false }: PriorityDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5" title={priority}>
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: COLOR[priority] }}
        aria-label={`Priority: ${priority}`}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground capitalize">{priority}</span>
      )}
    </span>
  );
}
