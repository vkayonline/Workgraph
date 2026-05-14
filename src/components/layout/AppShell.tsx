import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { NetworkIndicator } from '../shared/NetworkIndicator';
import { CaptureModal } from '../capture/CaptureModal';
import { SettingsModal } from '../settings/SettingsModal';
import { CommandPalette } from '../shared/CommandPalette';
import { BackgroundProcessor } from '../shared/BackgroundProcessor';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { FOCUS_REPLAY_INPUT_EVENT } from '../replay/ReplayPage';

const NAV_ROUTES = ['/', '/entries', '/replay'] as const;

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia('(min-width: 1024px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
}

export function AppShell() {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureType, setCaptureType] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();

  // Cmd+K — open command palette
  useKeyboardShortcut({ 
    key: 'k', 
    meta: true, 
    onTrigger: () => setCommandPaletteOpen(prev => !prev) 
  });

  // Cmd+/ — jump to chat and focus its input (fires even from inputs)
  const goToReplay = useCallback(() => {
    navigate('/replay');
    setTimeout(() => window.dispatchEvent(new CustomEvent(FOCUS_REPLAY_INPUT_EVENT)), 50);
  }, [navigate]);
  useKeyboardShortcut({ key: '/', meta: true, onTrigger: goToReplay });

  // Handle custom events for opening capture with specific types
  useEffect(() => {
    const handler = (e: any) => {
      setCaptureType(e.detail?.type || null);
      setCaptureOpen(true);
    };
    window.addEventListener('workgraph:open-capture', handler);
    return () => window.removeEventListener('workgraph:open-capture', handler);
  }, []);

  // Cmd+1-3 — navigate to Today / Entries / Chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (isInputFocused() && e.key !== 'k') return;
      const idx = ['1', '2', '3'].indexOf(e.key);
      if (idx === -1) return;
      e.preventDefault();
      navigate(NAV_ROUTES[idx]);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {isDesktop ? (
        <>
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            <TopBar 
              onOpenSettings={() => setSettingsOpen(true)}              showCaptureButton 
            />
            <main className="flex-1 overflow-y-auto p-6 bg-faint">
              <Outlet />
            </main>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 bg-faint">
            <Outlet />
          </main>
          <BottomNav onCapture={() => { setCaptureType(null); setCaptureOpen(true); }} onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      )}

      <NetworkIndicator />
      <BackgroundProcessor />
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <CaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)} initialType={captureType} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
