export const ENTRY_TYPES = [
  'work_log',
  'decision',
  'issue',
  'solution',
  'meeting_note',
  'task',
  'learning',
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export interface EntryImage {
  id: string;
  data_url: string;
  mime_type: string;
  file_name: string;
}

export type AIStatus = 'pending' | 'processed' | 'failed';

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
  is_done: boolean;
  duration_minutes: number | null;
  starred: boolean;
  links: string[];                   // IDs of manually linked entries
  embedding_vector: number[] | null;
  classification_status: AIStatus;
  embedding_status: AIStatus;
  processing_metadata?: {
    classification_retries?: number;
    embedding_retries?: number;
    next_retry_at?: number;
    error?: string;
  };
}

export interface ClassificationResult {
  entry_type: EntryType;
  tags: string[];
  project: string | null;
  priority: Priority;
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
  embeddingSource: 'local' | 'api';
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
