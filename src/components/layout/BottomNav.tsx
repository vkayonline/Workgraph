import { NavLink } from 'react-router-dom';
import { Home, FileText, MessageSquare, Settings, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: '/',        label: 'Today',    Icon: Home },
  { to: '/entries', label: 'Entries',  Icon: FileText },
  { to: '/chat',    label: 'Chat',     Icon: MessageSquare },
  { to: '/settings',label: 'Settings', Icon: Settings },
];

interface BottomNavProps {
  onCapture: () => void;
}

export function BottomNav({ onCapture }: BottomNavProps) {
  return (
    <nav
      className="h-16 flex items-center border-t border-border bg-background shrink-0"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            [
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
              isActive ? 'text-primary font-medium' : 'text-muted-foreground',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} aria-hidden />
              {label}
            </>
          )}
        </NavLink>
      ))}

      <button
        onClick={onCapture}
        className="fixed right-4 bottom-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-[color-mix(in_srgb,var(--color-primary),white_25%)] transition-colors"
        aria-label="Quick capture"
      >
        <Plus size={24} />
      </button>
    </nav>
  );
}
