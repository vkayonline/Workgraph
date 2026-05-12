import { NavLink } from 'react-router-dom';
import { Home, FileText, Scale, MessageSquare, Settings, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',           label: 'Today',     Icon: Home },
  { to: '/entries',   label: 'Entries',   Icon: FileText },
  { to: '/decisions', label: 'Decisions', Icon: Scale },
  { to: '/chat',      label: 'Chat',      Icon: MessageSquare },
];

interface SidebarProps {
  onCapture: () => void;
}

export function Sidebar({ onCapture }: SidebarProps) {
  return (
    <nav
      className="w-56 h-dvh flex flex-col border-r border-border bg-background shadow-md shrink-0"
      aria-label="Main navigation"
    >
      <div className="flex-1 py-4 px-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-1.5 rounded-sm text-sm transition-colors',
                isActive
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-foreground hover:bg-accent',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} aria-hidden />
                {label}
              </>
            )}
          </NavLink>
        ))}

        <div className="my-2 border-t border-border" />

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            [
              'flex items-center gap-3 px-3 py-1.5 rounded-sm text-sm transition-colors',
              isActive
                ? 'bg-accent text-foreground font-medium'
                : 'text-foreground hover:bg-accent',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={16} strokeWidth={isActive ? 2 : 1.5} aria-hidden />
              Settings
            </>
          )}
        </NavLink>
      </div>

      <div className="p-2 border-t border-border">
        <button
          onClick={onCapture}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-[color-mix(in_srgb,var(--color-primary),white_25%)] transition-colors"
        >
          <Plus size={15} />
          New entry
        </button>
      </div>
    </nav>
  );
}
