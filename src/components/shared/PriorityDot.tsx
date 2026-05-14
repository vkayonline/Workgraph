import type { OperationalGravity } from '../../types';

interface PriorityDotProps {
  gravity: OperationalGravity;
  showLabel?: boolean;
}

// TODO: Refine visual representation of operational gravity
export function PriorityDot({ gravity, showLabel = false }: PriorityDotProps) {
  const color = gravity > 0.75 ? 'var(--color-priority-critical)' :
                gravity > 0.5 ? 'var(--color-priority-high)' :
                gravity > 0.25 ? 'var(--color-priority-medium)' :
                'var(--color-priority-low)';

  const label = gravity > 0.75 ? 'Critical' :
                gravity > 0.5 ? 'High' :
                gravity > 0.25 ? 'Medium' :
                'Low';

  return (
    <span className="inline-flex items-center gap-1.5" title={`Operational Gravity: ${gravity.toFixed(2)}`}>
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-label={`Operational Gravity: ${label}`}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground capitalize">{label}</span>
      )}
    </span>
  );
}
