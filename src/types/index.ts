export const ENTRY_TYPES = [
  'work_log',
  'decision',
  'problem',
  'solution',
  'meeting_note',
  'task',
  'learning',
  'blocker',
  'risk',
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SENTIMENTS = ['positive', 'neutral', 'negative', 'mixed'] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export interface EntryImage {
  id: string;
  data_url: string;
  mime_type: string;
  file_name: string;
}

export interface JournalEntry {
  id: string;
  created_at: number;
  timestamp: number;
  raw_text: string;
  images: EntryImage[];
  entry_type: EntryType;
  tags: string[];
  project: string | null;
  priority: Priority;
  sentiment: Sentiment;
  is_done: boolean;
  duration_minutes: number | null;
  starred: boolean;
  embedding_vector: number[] | null;
}

export interface ClassificationResult {
  entry_type: EntryType;
  tags: string[];
  project: string | null;
  priority: Priority;
  sentiment: Sentiment;
}

export interface UserProfile {
  name: string;
  dayToDay: string;
}

export interface Settings {
  userProfile: UserProfile;
  apiKey: string;
  baseUrl: string;
  model: string;
  embeddingModel: string;
  theme: Theme;
  lastExportAt: number | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cited_entry_ids?: string[];
  created_at: number;
}

export interface Template {
  id: string;
  name: string;
  entry_type: EntryType;
  content: string;
}
