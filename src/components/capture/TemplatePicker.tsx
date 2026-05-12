import type { EntryType } from '../../types';
import { TEMPLATES } from '../../data/templates';

interface TemplatePickerProps {
  selected: EntryType | null;
  onSelect: (type: EntryType) => void;
}

export function TemplatePicker({ selected, onSelect }: TemplatePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => onSelect(tpl.entry_type)}
          className={[
            'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
            selected === tpl.entry_type
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
          ].join(' ')}
        >
          {tpl.name}
        </button>
      ))}
    </div>
  );
}
