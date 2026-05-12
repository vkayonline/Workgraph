import { createContext, useContext, type ReactNode } from 'react';
import { useSettings } from '../hooks/useSettings';
import type { Settings } from '../types';

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  onboarded: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const value = useSettings();
  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used within SettingsProvider');
  return ctx;
}
