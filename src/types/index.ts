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

export type OperationalGravity = number;

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export type AIStatus = 'pending' | 'processed' | 'failed';

export interface JournalEntry {
  id: string;
  created_at: number;
  timestamp: number;
  raw_text: string;
  entry_type: EntryType;
  project_id: string | null;
  session_id: string | null;
  operational_gravity: OperationalGravity;
  is_done: boolean;
  duration_minutes: number | null;
  starred: boolean;
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

export interface Session {
  id: string;
  project_id: string | null;
  start_time: number;
  end_time: number | null;
  summary: string | null;
  status: 'active' | 'paused' | 'completed';
  created_at: number;
}

export type EdgeType = 'blocks' | 'caused_by' | 'resolves' | 'references' | 'duplicates' | 'related_to' | 'follows';

export interface Edge {
  id: string;
  source_id: string;
  target_id: string;
  edge_type: EdgeType;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  status: 'active' | 'archived';
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface EntryTag {
  entry_id: string;
  tag_id: string;
}

export interface Attachment {
  id: string;
  entry_id: string;
  mime_type: string;
  data_url: string;
  file_name: string;
  created_at: number;
}

export interface ClassificationResult {
  entry_type: EntryType;
  tags: string[];
  project: string | null;
  operational_gravity: OperationalGravity;
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

export type CommitmentStatus = 'active' | 'blocked' | 'overdue' | 'resolved';

export interface Commitment {
  id: string;
  created_at: number;
  due_at: number | null;
  status: CommitmentStatus;
  operational_gravity: number; // 0-1, inferred
  summary: string;
  related_session_id: string | null;
  related_entity_ids: string[]; // e.g., linked entries, projects, issues
}
