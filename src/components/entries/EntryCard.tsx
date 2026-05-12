import { useCallback } from 'react';
import type { JournalEntry } from '../../types';
import { EntryTypeBadge } from './EntryTypeBadge';
import { PriorityDot } from '../shared/PriorityDot';
import { putEntry } from '../../lib/db/entries';

interface EntryCardProps {
  entry: JournalEntry;
  onClick: (entry: JournalEntry) => void;
  onUpdate?: (entry: JournalEntry) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function truncate(text: string, max = 120): string {
  const plain = text.replace(/#{1,6}\s?/g, '').replace(/[*_`]/g, '');
  return plain.length > max ? plain.slice(0, max).trimEnd() + '…' : plain;
}

export function EntryCard({ entry, onClick, onUpdate }: EntryCardProps) {
  const handleTaskToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = { ...entry, is_done: !entry.is_done, timestamp: Date.now() };
      await putEntry(updated);
      onUpdate?.(updated);
    },
    [entry, onUpdate]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(entry)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(entry)}
      className="p-4 bg-card border border-border rounded-md shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-px transition-[box-shadow,transform] duration-[120ms]"
    >
      <div className="flex items-center gap-2 mb-2">
        {entry.entry_type === 'task' ? (
          <button
            onClick={handleTaskToggle}
            className="w-5 h-5 rounded border-2 border-border flex items-center justify-center shrink-0 text-xs hover:border-primary transition-colors"
            aria-label={entry.is_done ? 'Mark incomplete' : 'Mark complete'}
          >
            {entry.is_done && '✓'}
          </button>
        ) : (
          <EntryTypeBadge type={entry.entry_type} />
        )}
        {entry.project && (
          <span className="text-xs text-muted-foreground truncate">{entry.project}</span>
        )}
        <PriorityDot priority={entry.priority} />
      </div>

      <p
        className={[
          'text-sm text-foreground mb-2 line-clamp-2',
          entry.is_done ? 'line-through opacity-50' : '',
        ].join(' ')}
      >
        {truncate(entry.raw_text)}
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatTime(entry.created_at)}</span>
        {entry.tags.length > 0 && (
          <>
            <span>·</span>
            <span>{entry.tags.map((t) => `#${t}`).join(' ')}</span>
          </>
        )}
      </div>
    </div>
  );
}
