import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { NetworkIndicator } from '../shared/NetworkIndicator';
import { CaptureModal } from '../capture/CaptureModal';
import { SettingsModal } from '../settings/SettingsModal';
import { BackgroundProcessor } from '../shared/BackgroundProcessor';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { FOCUS_CHAT_INPUT_EVENT } from '../chat/ChatPage';

const NAV_ROUTES = ['/', '/entries', '/decisions', '/chat', '/calendar', '/graph', '/insights'] as const;

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();

  // Cmd+/ — jump to chat and focus its input (fires even from inputs)
  const goToChat = useCallback(() => {
    navigate('/chat');
    setTimeout(() => window.dispatchEvent(new CustomEvent(FOCUS_CHAT_INPUT_EVENT)), 50);
  }, [navigate]);
  useKeyboardShortcut({ key: '/', meta: true, onTrigger: goToChat });

  // Cmd+1–4 — navigate to Today / Entries / Decisions / Chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (isInputFocused()) return;
      const idx = ['1', '2', '3', '4', '5', '6', '7'].indexOf(e.key);
      if (idx === -1) return;
      e.preventDefault();
      navigate(NAV_ROUTES[idx]);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {isDesktop ? (
        <>
          <Sidebar onCapture={() => setCaptureOpen(true)} />
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            <TopBar 
              onCapture={() => setCaptureOpen(true)} 
              onOpenSettings={() => setSettingsOpen(true)}
              showCaptureButton 
            />
            <main className="flex-1 overflow-y-auto p-6 bg-faint">
              <Outlet />
            </main>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            onCapture={() => setCaptureOpen(true)} 
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 bg-faint">
            <Outlet />
          </main>
          <BottomNav onCapture={() => setCaptureOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      )}

      <NetworkIndicator />
      <BackgroundProcessor />
      <CaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
