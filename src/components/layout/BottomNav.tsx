import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, FileText, MessageSquare, Plus, MoreHorizontal,
  Scale, Calendar, GitBranch, AreaChart, Settings
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const MAIN_NAV_ITEMS: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: '/', label: 'Today', Icon: Home },
  { to: '/entries', label: 'Entries', Icon: FileText },
  { to: '/chat',    label: 'Chat',     Icon: MessageSquare },
];

const MORE_NAV_ITEMS: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: '/decisions', label: 'Decisions', Icon: Scale },
  { to: '/calendar',  label: 'Calendar',  Icon: Calendar },
  { to: '/insights',  label: 'Insights',  Icon: AreaChart },
];

interface BottomNavProps {
  onCapture: () => void;
  onOpenSettings: () => void;
}

function MoreMenu({ isOpen, onClose, onOpenSettings }: { isOpen: boolean; onClose: () => void; onOpenSettings: () => void; }) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-20 animate-in fade-in-0" 
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg rounded-t-2xl z-30 animate-in slide-in-from-bottom-24 duration-300">
        <div className="grid grid-cols-4 gap-2 p-4">
          {MORE_NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            >
              <Icon size={22} strokeWidth={1.5} />
              <span className="text-xs text-center">{label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => { onOpenSettings(); onClose(); }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          >
            <Settings size={22} strokeWidth={1.5} />
            <span className="text-xs text-center">Settings</span>
          </button>
        </div>
        <div className="pb-safe-bottom" />
      </div>
    </>
  );
}


export function BottomNav({ onCapture, onOpenSettings }: BottomNavProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <>
      <nav
        className="h-16 flex items-center border-t border-border bg-background shrink-0"
        aria-label="Mobile navigation"
      >
        {MAIN_NAV_ITEMS.map(({ to, label, Icon }) => (
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
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground"
        >
          <MoreHorizontal size={18} strokeWidth={2} aria-hidden />
          More
        </button>
      </nav>

      <MoreMenu 
        isOpen={isMoreMenuOpen} 
        onClose={() => setIsMoreMenuOpen(false)}
        onOpenSettings={onOpenSettings}
      />


      <button
        onClick={onCapture}
        className="fixed right-4 bottom-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-[color-mix(in_srgb,var(--color-primary),white_25%)] transition-colors"
        aria-label="Quick capture"
      >
        <Plus size={24} />
      </button>
    </>
  );
}
