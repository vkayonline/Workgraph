import { useState, useEffect, useCallback } from 'react';
import type { Settings, Theme } from '../types';

const STORAGE_KEY = 'workgraph:settings';

const DEFAULT_SETTINGS: Settings = {
  userProfile: { name: '', dayToDay: '' },
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  embeddingSource: 'local',
  theme: 'system',
  lastExportAt: null,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function save(s: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function isOnboarded(s: Settings): boolean {
  return Boolean(s.userProfile.name && s.userProfile.dayToDay && s.apiKey);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    applyTheme(settings.theme);

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  return { settings, update, onboarded: isOnboarded(settings) };
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (theme === 'dark' || (theme === 'system' && prefersDark)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
