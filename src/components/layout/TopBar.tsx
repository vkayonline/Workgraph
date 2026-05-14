import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Monitor, Search as SearchIcon, Settings as SettingsIcon } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import type { Theme } from '../../types';

const ROUTE_LABELS: Record<string, { emoji: string; label: string }> = {
  '/':          { emoji: '🏠', label: 'Today' },
  '/entries':   { emoji: '📝', label: 'Timeline' },
  '/replay':    { emoji: '💬', label: 'Replay' },
};

const THEME_OPTIONS: { theme: Theme; label: string; Icon: typeof Sun }[] = [
  { theme: 'light', label: 'Light', Icon: Sun },
  { theme: 'dark', label: 'Dark', Icon: Moon },
  { theme: 'system', label: 'System', Icon: Monitor },
];

interface TopBarProps {
  onOpenSettings: () => void;
  showCaptureButton?: boolean;
}

export function TopBar({ onOpenSettings, showCaptureButton = false }: TopBarProps) {
  const { pathname } = useLocation();
  const { settings, update } = useSettingsContext();
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cmd+K is handled in AppShell for the Command Palette

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const page = ROUTE_LABELS[pathname] ?? { emoji: '', label: '' };

  const handleThemeChange = (theme: Theme) => {
    update({ theme });
    setIsThemeDropdownOpen(false);
  };

  const CurrentThemeIcon =
    settings.theme === 'light' ? Sun :
    settings.theme === 'dark' ? Moon :
    Monitor;

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {page.emoji && (
          <span className="text-base leading-none shrink-0">{page.emoji}</span>
        )}
        <h1 className="text-sm font-semibold text-foreground truncate">{page.label}</h1>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {showCaptureButton && (
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1.5 hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Command Palette (Cmd+K)"
          >
            <SearchIcon size={14} />
            <span>Command</span>
            <kbd className="text-[10px] bg-secondary px-1 py-0.5 rounded font-mono leading-none">⌘K</kbd>
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="Select theme"
          >
            <CurrentThemeIcon size={16} />
          </button>
          {isThemeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-background border border-border rounded-md shadow-lg z-10 py-1">
              {THEME_OPTIONS.map(({ theme, label, Icon }) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Icon size={14} className="text-muted-foreground" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          aria-label="Settings"
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    </header>
  );
}

