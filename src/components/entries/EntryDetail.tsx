import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, Check, Star, Link2, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { EntryTypeBadge } from './EntryTypeBadge';
import { PriorityDot } from '../shared/PriorityDot';
import { Button } from '../shared/Button';
import { putEntry, deleteEntry, toggleStar, getEntry, getBacklinks, searchEntries } from '../../lib/db/entries';
import type { JournalEntry } from '../../types';

interface EntryDetailProps {
  entry: JournalEntry;
  onClose: () => void;
  onUpdate: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onNavigate?: (entry: JournalEntry) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function EntryDetail({ entry, onClose, onUpdate, onDelete, onNavigate }: EntryDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(entry.raw_text);
  const [editDuration, setEditDuration] = useState<string>(
    entry.duration_minutes != null ? String(entry.duration_minutes) : ''
  );
  const [saving, setSaving] = useState(false);

  // Linked entries
  const [linkedEntries, setLinkedEntries] = useState<JournalEntry[]>([]);
  const [backlinks, setBacklinks] = useState<JournalEntry[]>([]);

  // Link search
  const [linkQuery, setLinkQuery] = useState('');
  const [linkResults, setLinkResults] = useState<JournalEntry[]>([]);

  useEffect(() => {
    setEditText(entry.raw_text);
    setEditDuration(entry.duration_minutes != null ? String(entry.duration_minutes) : '');
  }, [entry]);

  useEffect(() => {
    async function loadRefs() {
      const [linked, bl] = await Promise.all([
        Promise.all((entry.links ?? []).map((id) => getEntry(id))),
        getBacklinks(entry.id),
      ]);
      setLinkedEntries(linked.filter(Boolean) as JournalEntry[]);
      setBacklinks(bl);
    }
    loadRefs();
  }, [entry]);

  useEffect(() => {
    if (!linkQuery.trim()) { setLinkResults([]); return; }
    const t = setTimeout(async () => {
      const results = await searchEntries(linkQuery);
      setLinkResults(results.filter((e) => e.id !== entry.id).slice(0, 6));
    }, 200);
    return () => clearTimeout(t);
  }, [linkQuery, entry.id]);

  async function handleSave() {
    if (!editText.trim()) return;
    setSaving(true);
    const duration = editDuration.trim() ? parseInt(editDuration, 10) : null;
    const updated = {
      ...entry,
      raw_text: editText.trim(),
      duration_minutes: duration && !isNaN(duration) ? duration : null,
      timestamp: Date.now(),
    };
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

  async function handleStarToggle() {
    const updated = await toggleStar(entry);
    onUpdate(updated);
    window.dispatchEvent(new CustomEvent('workgraph:entry-saved'));
  }

  async function handleAddLink(target: JournalEntry) {
    if (entry.links?.includes(target.id)) return;
    const updated = { ...entry, links: [...(entry.links ?? []), target.id] };
    await putEntry(updated);
    onUpdate(updated);
    setLinkedEntries((prev) => [...prev, target]);
    setLinkQuery('');
    setLinkResults([]);
  }

  async function handleRemoveLink(targetId: string) {
    const updated = { ...entry, links: (entry.links ?? []).filter((id) => id !== targetId) };
    await putEntry(updated);
    onUpdate(updated);
    setLinkedEntries((prev) => prev.filter((e) => e.id !== targetId));
  }

  const navigate = onNavigate ?? onClose;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={onClose} />

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
          <div className="flex items-center gap-2">
            <button
              onClick={handleStarToggle}
              className={[
                'transition-colors p-1 rounded-sm',
                entry.starred ? 'text-warning' : 'text-muted-foreground hover:text-warning',
              ].join(' ')}
              aria-label={entry.starred ? 'Unstar' : 'Star'}
            >
              <Star size={16} fill={entry.starred ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <p className="text-xs text-muted-foreground">
            {formatDate(entry.created_at)}
            {entry.project && <span> · {entry.project}</span>}
            {entry.duration_minutes != null && <span> · {entry.duration_minutes}m</span>}
          </p>
          {entry.tags.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{entry.tags.map((t) => `#${t}`).join(' ')}</p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-4">
          {editing ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                rows={10}
                className="w-full text-sm bg-background border border-input rounded-md p-3 text-foreground resize-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0"
              />
              {entry.entry_type === 'work_log' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground shrink-0">Duration (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g. 90"
                    className="w-24 px-2 py-1 text-sm border border-input rounded-md bg-background text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0"
                  />
                </div>
              )}
              {/* Link search in edit mode */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link2 size={11} /> Link entries
                </label>
                <input
                  value={linkQuery}
                  onChange={(e) => setLinkQuery(e.target.value)}
                  placeholder="Search entries to link…"
                  className="px-2 py-1.5 text-sm border border-input rounded-md bg-background text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0"
                />
                {linkResults.length > 0 && (
                  <ul className="border border-border rounded-md divide-y divide-border overflow-hidden">
                    {linkResults.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => handleAddLink(r)}
                          disabled={entry.links?.includes(r.id)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors disabled:opacity-40"
                        >
                          <span className="font-medium">{r.entry_type.replace('_', ' ')}</span>
                          {' · '}
                          {r.raw_text.replace(/[#*_`]/g, '').slice(0, 60)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
              <ReactMarkdown>{entry.raw_text}</ReactMarkdown>
            </div>
          )}

          {entry.images.length > 0 && !editing && (
            <div className="flex flex-wrap gap-3">
              {entry.images.map((img) => (
                <img key={img.id} src={img.data_url} alt={img.file_name}
                  className="max-h-48 rounded-md border border-border object-cover" />
              ))}
            </div>
          )}

          {/* Linked entries */}
          {(linkedEntries.length > 0 || backlinks.length > 0) && !editing && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              {linkedEntries.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Link2 size={11} /> Linked
                  </p>
                  <ul className="flex flex-col gap-1">
                    {linkedEntries.map((l) => (
                      <li key={l.id} className="flex items-center gap-2 text-xs text-foreground">
                        <button
                          onClick={() => navigate(l)}
                          className="flex-1 text-left hover:underline truncate"
                        >
                          <EntryTypeBadge type={l.entry_type} />
                          <span className="ml-2">{l.raw_text.replace(/[#*_`]/g, '').slice(0, 60)}</span>
                        </button>
                        <button onClick={() => handleRemoveLink(l.id)}
                          className="text-muted-foreground hover:text-danger transition-colors shrink-0"
                          aria-label="Remove link">
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {backlinks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <ExternalLink size={11} /> Referenced by
                  </p>
                  <ul className="flex flex-col gap-1">
                    {backlinks.map((b) => (
                      <li key={b.id}>
                        <button onClick={() => navigate(b)}
                          className="text-xs text-left hover:underline text-foreground truncate w-full">
                          <EntryTypeBadge type={b.entry_type} />
                          <span className="ml-2">{b.raw_text.replace(/[#*_`]/g, '').slice(0, 60)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
          {editing ? (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              <Button variant="ghost" onClick={() => { setEditing(false); setEditText(entry.raw_text); }}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit
            </Button>
          )}
          {!editing && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={14} /> Delete
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
