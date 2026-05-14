import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, Check, Star, Link2, ExternalLink, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // Or any other theme

import { EntryTypeBadge } from './EntryTypeBadge';
import { PriorityDot } from '../shared/PriorityDot';
import { Button } from '../shared/Button';
import { getEntry, searchEntries, getEdgesForSource, getEdgesForTarget, saveEdge, deleteEdge } from '../../lib/db/entries';
import { JournalRepository } from '../../lib/db/repository';
import type { JournalEntry, Edge } from '../../types';

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
  
  // Syntax highlighting for code blocks
  useEffect(() => {
    hljs.highlightAll();
  }, [editText]); // Re-highlight when markdown content changes

  useEffect(() => {
    async function loadRefs() {
      const outEdges = await getEdgesForSource(entry.id);
      const inEdges = await getEdgesForTarget(entry.id);
      const [linked, bl] = await Promise.all([
        Promise.all(outEdges.map((e) => getEntry(e.target_id))),
        Promise.all(inEdges.map((e) => getEntry(e.source_id))),
      ]);
      setLinkedEntries(linked.filter(Boolean) as JournalEntry[]);
      setBacklinks(bl.filter(Boolean) as JournalEntry[]);
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
    await JournalRepository.save(updated);
    onUpdate(updated);
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this entry?')) return;
    await JournalRepository.delete(entry.id);
    onDelete(entry.id);
    onClose();
  }

  async function handleTaskToggle() {
    const updated = { ...entry, is_done: !entry.is_done, timestamp: Date.now() };
    await JournalRepository.save(updated);
    onUpdate(updated);
  }

  async function handleStarToggle() {
    const updated = await JournalRepository.toggleStar(entry);
    onUpdate(updated);
  }

  async function handleAddLink(target: JournalEntry) {
    if (linkedEntries.some(e => e.id === target.id)) return;
    const edge: Edge = {
      id: crypto.randomUUID(),
      source_id: entry.id,
      target_id: target.id,
      edge_type: 'references',
      timestamp: Date.now()
    };
    await saveEdge(edge);
    setLinkedEntries((prev) => [...prev, target]);
    setLinkQuery('');
    setLinkResults([]);
  }

  async function handleRemoveLink(targetId: string) {
    const outEdges = await getEdgesForSource(entry.id);
    const edge = outEdges.find((e: Edge) => e.target_id === targetId);
    if (edge) {
      await deleteEdge(edge.id);
      setLinkedEntries((prev) => prev.filter((e) => e.id !== targetId));
    }
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
            <PriorityDot gravity={entry.operational_gravity} showLabel />
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
              <Star size={14} fill={entry.starred ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <p className="text-xs text-muted-foreground">
            {formatDate(entry.created_at)}
            {entry.duration_minutes != null && <span> · {entry.duration_minutes}m</span>}
          </p>
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
                className="w-full text-sm bg-background border border-input rounded-md p-3 text-foreground resize-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0 font-mono"
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
            </div>
          ) : (
            <>
              <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    code({node, inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <pre className="relative rounded-md my-2">
                          <code className={`language-${match[1]}`} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >{entry.raw_text}</ReactMarkdown>
              </div>

              {/* Quick Link Search (always available when not editing) */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Link2 size={12} /> Connect Memory
                  </label>
                </div>
                <div className="relative">
                  <input
                    value={linkQuery}
                    onChange={(e) => setLinkQuery(e.target.value)}
                    placeholder="Search memories to link..."
                    className="w-full px-3 py-1.5 text-xs bg-muted/30 border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                  {linkResults.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-200">
                      <ul className="divide-y divide-border">
                        {linkResults.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => handleAddLink(r)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-primary/5 transition-colors group flex items-center gap-2"
                            >
                              <EntryTypeBadge type={r.entry_type} />
                              <span className="flex-1 truncate group-hover:text-primary">{r.raw_text.replace(/[#*_`]/g, '').slice(0, 60)}</span>
                              <Plus size={12} className="text-muted-foreground group-hover:text-primary" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Linked entries */}
          {(linkedEntries.length > 0 || backlinks.length > 0) && !editing && (
            <div className="flex flex-col gap-4 pt-4 border-t border-border mt-2">
              {linkedEntries.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Link2 size={12} /> Explicit Connections
                  </p>
                  <div className="space-y-1">
                    {linkedEntries.map((l) => (
                      <div key={l.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-all">
                        <button
                          onClick={() => navigate(l)}
                          className="flex-1 text-left flex items-center gap-2 min-w-0"
                        >
                          <EntryTypeBadge type={l.entry_type} />
                          <span className="text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {l.raw_text.replace(/[#*_`]/g, '').slice(0, 80)}
                          </span>
                        </button>
                        <button onClick={() => handleRemoveLink(l.id)}
                          className="text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-1"
                          aria-label="Remove link">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {backlinks.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <ExternalLink size={12} /> Referenced by
                  </p>
                  <div className="space-y-1">
                    {backlinks.map((b) => (
                      <button 
                        key={b.id}
                        onClick={() => navigate(b)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-all group"
                      >
                        <EntryTypeBadge type={b.entry_type} />
                        <span className="text-xs text-foreground truncate group-hover:text-primary transition-colors text-left">
                          {b.raw_text.replace(/[#*_`]/g, '').slice(0, 80)}
                        </span>
                      </button>
                    ))}
                  </div>
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
