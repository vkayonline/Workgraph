import { useEffect, useState } from 'react';
import { JournalRepository, DATA_EVENTS } from '../lib/db/repository';

export interface DashboardStats {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  entriesThisWeek: number;
}

/** Returns the ISO date string for a timestamp, in local time. */
function toLocalDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcStreaks(activeDays: Set<string>): { current: number; longest: number } {
  if (activeDays.size === 0) return { current: 0, longest: 0 };

  const today = toLocalDateStr(Date.now());
  const yesterday = toLocalDateStr(Date.now() - 86400000);

  // Sort dates descending
  const sorted = [...activeDays].sort((a, b) => (a > b ? -1 : 1));

  // Current streak: consecutive days from today (or yesterday)
  let current = 0;
  const startDay = activeDays.has(today) ? today : activeDays.has(yesterday) ? yesterday : null;
  if (startDay) {
    let check = startDay;
    while (activeDays.has(check)) {
      current++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = toLocalDateStr(d.getTime());
    }
  }

  // Longest streak: scan all active days
  let longest = 0;
  let run = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = new Date(sorted[i]);
    const b = new Date(sorted[i + 1]);
    const diffDays = Math.round((a.getTime() - b.getTime()) / 86400000);
    if (diffDays === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  if (sorted.length === 1) longest = 1;
  longest = Math.max(longest, current, run);

  return { current, longest };
}

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalEntries: 0,
    entriesThisWeek: 0,
  });

  async function compute() {
    const entries = await JournalRepository.getAll();
    const activeDays = new Set(entries.map((e) => toLocalDateStr(e.created_at)));
    const { current, longest } = calcStreaks(activeDays);

    const weekAgo = Date.now() - 7 * 86400000;
    const entriesThisWeek = entries.filter((e) => e.created_at >= weekAgo).length;

    setStats({ currentStreak: current, longestStreak: longest, totalEntries: entries.length, entriesThisWeek });
  }

  useEffect(() => {
    compute();
    const handler = () => compute();
    window.addEventListener(DATA_EVENTS.ENTRY_SAVED, handler);
    window.addEventListener(DATA_EVENTS.ENTRY_DELETED, handler);
    return () => {
      window.removeEventListener(DATA_EVENTS.ENTRY_SAVED, handler);
      window.removeEventListener(DATA_EVENTS.ENTRY_DELETED, handler);
    };
  }, []);

  return stats;
}
