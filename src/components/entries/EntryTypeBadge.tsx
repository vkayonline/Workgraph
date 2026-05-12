import type { EntryType } from '../../types';

interface EntryTypeBadgeProps {
  type: EntryType;
  className?: string;
}

const TYPE_LABELS: Record<EntryType, string> = {
  work_log: 'work log',
  decision: 'decision',
  problem: 'problem',
  solution: 'solution',
  meeting_note: 'meeting',
  task: 'task',
  learning: 'learning',
  blocker: 'blocker',
  risk: 'risk',
};

const TYPE_COLOR_VAR: Record<EntryType, string> = {
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

export function EntryTypeBadge({ type, className = '' }: EntryTypeBadgeProps) {
  const color = TYPE_COLOR_VAR[type];
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-3 py-0.5 text-[0.8125rem] font-medium rounded-full border',
        className,
      ].join(' ')}
      style={{
        color,
        background: `color-mix(in srgb, ${color}, transparent 85%)`,
        borderColor: `color-mix(in srgb, ${color}, transparent 70%)`,
      }}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}
