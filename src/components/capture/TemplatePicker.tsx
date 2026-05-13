import { Layout, CheckSquare, AlertCircle, Calendar } from 'lucide-react';
import type { EntryType } from '../../types';
import { TEMPLATES } from '../../data/templates';

interface TemplatePickerProps {
  selected: EntryType | null;
  onSelect: (type: EntryType) => void;
}

const TYPE_ICONS: Record<string, any> = {
  meeting_note: Calendar,
  decision: Layout,
  issue: AlertCircle,
  task: CheckSquare,
};

export function TemplatePicker({ selected, onSelect }: TemplatePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATES.map((tpl) => {
        const Icon = TYPE_ICONS[tpl.entry_type] || Layout;
        return (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl.entry_type)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-md border transition-all',
              selected === tpl.entry_type
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
            ].join(' ')}
          >
            <Icon size={12} strokeWidth={2.5} />
            {tpl.name}
          </button>
        );
      })}
    </div>
  );
}
