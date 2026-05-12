import { useState } from 'react';
import { X, Pencil, Trash2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { EntryTypeBadge } from './EntryTypeBadge';
import { PriorityDot } from '../shared/PriorityDot';
import { Button } from '../shared/Button';
import { putEntry, deleteEntry } from '../../lib/db/entries';
import type { JournalEntry } from '../../types';

interface EntryDetailProps {
  entry: JournalEntry;
  onClose: () => void;
  onUpdate: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function EntryDetail({ entry, onClose, onUpdate, onDelete }: EntryDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(entry.raw_text);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!editText.trim()) return;
    setSaving(true);
    const updated = { ...entry, raw_text: editText.trim(), timestamp: Date.now() };
    await putEntry(updated);
    onUpdate(updated);
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this entry?')) return;
    await deleteEntry(entry.id);
    onDelete(entry.id);
    onClose();
  }

  async function handleTaskToggle() {
    const updated = { ...entry, is_done: !entry.is_done, timestamp: Date.now() };
    await putEntry(updated);
    onUpdate(updated);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-card border-l border-border shadow-lg flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {entry.entry_type === 'task' ? (
              <button
                onClick={handleTaskToggle}
                className="w-5 h-5 rounded border-2 border-border flex items-center justify-center text-xs hover:border-primary transition-colors"
                aria-label={entry.is_done ? 'Mark incomplete' : 'Mark complete'}
              >
                {entry.is_done && <Check size={12} />}
              </button>
            ) : (
              <EntryTypeBadge type={entry.entry_type} />
            )}
            <PriorityDot priority={entry.priority} showLabel />
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <p className="text-xs text-muted-foreground">
            {formatDate(entry.created_at)}
            {entry.project && <span> · {entry.project}</span>}
          </p>
          {entry.tags.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {entry.tags.map((t) => `#${t}`).join(' ')}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {editing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
              className="w-full h-full min-h-48 text-sm bg-background border border-input rounded-md p-3 text-foreground resize-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0"
            />
          ) : (
            <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
              <ReactMarkdown>{entry.raw_text}</ReactMarkdown>
            </div>
          )}

          {entry.images.length > 0 && !editing && (
            <div className="flex flex-wrap gap-3 mt-4">
              {entry.images.map((img) => (
                <img
                  key={img.id}
                  src={img.data_url}
                  alt={img.file_name}
                  className="max-h-48 rounded-md border border-border object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
          {editing ? (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="ghost" onClick={() => { setEditing(false); setEditText(entry.raw_text); }}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setEditing(true)}>
              <Pencil size={14} />
              Edit
            </Button>
          )}
          {!editing && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={14} />
              Delete
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
