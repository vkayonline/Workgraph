import { useCallback } from 'react';
import { Star } from 'lucide-react';
import type { JournalEntry } from '../../types';
import { EntryTypeBadge } from './EntryTypeBadge';
import { PriorityDot } from '../shared/PriorityDot';
import { JournalRepository } from '../../lib/db/repository';

interface EntryCardProps {
  entry: JournalEntry;
  onClick: (entry: JournalEntry) => void;
  onUpdate?: (entry: JournalEntry) => void;
  /** Highlight substring for keyword search */
  highlight?: string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function truncate(text: string, max = 120): string {
  // Strip common markdown for preview
  const plain = text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/[*_`]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Images
    .replace(/^\s*[-*+]\s+/gm, '') // Bullets
    .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
    .trim();
  return plain.length > max ? plain.slice(0, max).trimEnd() + '…' : plain;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-warning/30 text-foreground rounded-sm">{part}</mark> : part
  );
}

export function EntryCard({ entry, onClick, onUpdate, highlight }: EntryCardProps) {
  const handleTaskToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = { ...entry, is_done: !entry.is_done, timestamp: Date.now() };
      await JournalRepository.save(updated);
      onUpdate?.(updated);
    },
    [entry, onUpdate]
  );

  const handleStarToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = await JournalRepository.toggleStar(entry);
      onUpdate?.(updated);
    },
    [entry, onUpdate]
  );

  const preview = truncate(entry.raw_text);

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
        <PriorityDot gravity={entry.operational_gravity} />
        <button
          onClick={handleStarToggle}
          className={[
            'ml-auto shrink-0 transition-colors',
            entry.starred ? 'text-warning' : 'text-muted-foreground hover:text-warning',
          ].join(' ')}
          aria-label={entry.starred ? 'Unstar' : 'Star'}
        >
          <Star size={14} fill={entry.starred ? 'currentColor' : 'none'} />
        </button>
      </div>

      <p
        className={[
          'text-sm text-foreground mb-2 line-clamp-2 font-mono',
          entry.is_done ? 'line-through opacity-50' : '',
        ].join(' ')}
      >
        {highlight ? highlightText(preview, highlight) : preview}
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <span className="font-sans">{formatTime(entry.created_at)}</span>
        {entry.duration_minutes != null && (
          <><span>·</span><span>{entry.duration_minutes}m</span></>
        )}
      </div>
    </div>
  );
}
