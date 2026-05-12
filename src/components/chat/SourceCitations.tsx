import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EntryTypeBadge } from '../entries/EntryTypeBadge';
import type { JournalEntry } from '../../types';

interface SourceCitationsProps {
  entries: JournalEntry[];
}

export function SourceCitations({ entries }: SourceCitationsProps) {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={open}
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {entries.length} source{entries.length > 1 ? 's' : ''}
      </button>

      {open && (
        <ul className="mt-2 flex flex-col gap-1.5" aria-label="Source entries">
          {entries.map((e) => {
            const date = new Date(e.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short',
            });
            const preview = e.raw_text.replace(/[#*_`>]/g, '').trim().slice(0, 80);
            return (
              <li
                key={e.id}
                className="flex flex-col gap-0.5 px-2.5 py-2 rounded border border-border bg-faint text-xs"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <EntryTypeBadge type={e.entry_type} />
                  {e.project && (
                    <span className="text-muted-foreground">{e.project}</span>
                  )}
                  <span className="text-muted-foreground ml-auto">{date}</span>
                </div>
                {preview && (
                  <p className="text-foreground leading-snug">
                    {preview}{e.raw_text.length > 80 ? '…' : ''}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
