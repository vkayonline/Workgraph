import { Hexagon, Plus } from 'lucide-react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

interface TopBarProps {
  onCapture: () => void;
  showCaptureButton?: boolean;
}

export function TopBar({ onCapture, showCaptureButton = false }: TopBarProps) {
  useKeyboardShortcut({ key: 'k', meta: true, onTrigger: onCapture });

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
        <Hexagon size={18} strokeWidth={1.5} />
        <span>WorkGraph</span>
      </div>
      {showCaptureButton && (
        <button
          onClick={onCapture}
          className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-md px-3 py-1 hover:bg-accent transition-colors"
          aria-label="Quick capture (Cmd+K)"
        >
          <Plus size={14} />
          <span>Capture</span>
          <kbd className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
      )}
    </header>
  );
}
