import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Hexagon, Settings, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface NavItem {
  to: string;
  emoji: string;
  label: string;
}

const CORE_NAV: NavItem[] = [
  { to: '/',           emoji: '🏠', label: 'Today' },
  { to: '/entries',    emoji: '📝', label: 'Entries' },
  { to: '/decisions',  emoji: '⚖️',  label: 'Decisions' },
  { to: '/chat',       emoji: '💬', label: 'Chat' },
];

const VIEW_NAV: NavItem[] = [
  { to: '/calendar',   emoji: '📅', label: 'Calendar' },
  { to: '/insights',   emoji: '📊', label: 'Insights' },
];

function NavItemLink({ to, emoji, label, collapsed }: NavItem & { collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors min-w-0',
          isActive
            ? 'bg-[var(--color-sidebar-item-active)] text-foreground font-bold'
            : 'text-foreground/70 hover:bg-[var(--color-sidebar-item-hover)] hover:text-foreground',
        ].join(' ')
      }
    >
      <span className="text-lg leading-none shrink-0 w-5 text-center">{emoji}</span>
      {!collapsed && <span className="truncate tracking-tight">{label}</span>}
    </NavLink>
  );
}

interface SidebarProps {
  onCapture: () => void;
}

export function Sidebar({ onCapture }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <nav
      style={{ background: 'var(--color-sidebar)' }}
      className={[
        'h-dvh flex flex-col border-r border-border shrink-0 transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-56',
      ].join(' ')}
      aria-label="Main navigation"
    >
      {/* Brand header */}
      <div className={[
        'flex items-center border-b border-border h-12 shrink-0 px-3',
        collapsed ? 'justify-center' : 'justify-between',
      ].join(' ')}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 text-foreground font-bold text-sm hover:opacity-80 transition-opacity min-w-0"
          aria-label="WorkGraph home"
        >
          <div className="w-6 h-6 bg-primary rounded-[4px] flex items-center justify-center shrink-0" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <div className="w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
          {!collapsed && <span className="truncate tracking-tight">WorkGraph</span>}
        </button>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-md text-foreground/40 hover:text-foreground hover:bg-[var(--color-sidebar-item-hover)] transition-colors shrink-0"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 p-1 rounded-md text-foreground/40 hover:text-foreground hover:bg-[var(--color-sidebar-item-hover)] transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Nav scroll area */}
      <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
        {/* Core nav */}
        {CORE_NAV.map((item) => (
          <NavItemLink key={item.to} {...item} collapsed={collapsed} />
        ))}

        {/* Views section */}
        <div className="mt-3 mb-1">
          {!collapsed && (
            <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-foreground/30 mb-1">
              Views
            </p>
          )}
          {collapsed && <div className="border-t border-border/50 mx-1 my-1" />}
        </div>

        {VIEW_NAV.map((item) => (
          <NavItemLink key={item.to} {...item} collapsed={collapsed} />
        ))}
      </div>
    </nav>
  );
}
