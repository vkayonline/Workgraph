import { useState, useRef, useEffect } from 'react';
import { Send, Clock, Sparkles, Brain, ArrowRight } from 'lucide-react';
import { Spinner } from '../shared/Spinner';
import { useCapture } from '../../hooks/useCapture';
import { useSemanticSearch } from '../../hooks/useSemanticSearch';
import { TemplatePicker } from './TemplatePicker';
import { EntryTypeBadge } from '../entries/EntryTypeBadge';
import type { EntryType } from '../../types';
import { TEMPLATES } from '../../data/templates';

interface CaptureFormProps {
  onSuccess?: () => void;
  className?: string;
  autoFocus?: boolean;
  minimal?: boolean;
  initialType?: EntryType | null;
}

export function CaptureForm({ 
  onSuccess, 
  className = '', 
  autoFocus = false, 
  minimal = false,
  initialType = null
}: CaptureFormProps) {
  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [duration, setDuration] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { submit, loading } = useCapture();

  // Proactive Resurfacing Hook
  const { results: relatedMemories, isSearching } = useSemanticSearch(text, 2);

  // Reset/Initialize based on initialType
  useEffect(() => {
    if (initialType) {
      const tpl = TEMPLATES.find((t) => t.entry_type === initialType);
      setSelectedType(initialType);
      if (tpl) setText(tpl.content);
      else setText('');
    } else {
      setSelectedType(null);
      setText('');
    }
    setDuration('');
  }, [initialType]);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  function applyTemplate(type: EntryType) {
    if (text.trim() && !window.confirm('Applying a template will replace your current content. Continue?')) {
      return;
    }
    const tpl = TEMPLATES.find((t) => t.entry_type === type);
    setSelectedType(type);
    if (tpl) setText(tpl.content);
    setShowTemplates(false);
    textareaRef.current?.focus();
  }

  async function handlePaste(e: React.ClipboardEvent) {
    // Check for URLs for auto-hydration
    const pasteText = e.clipboardData.getData('text');
    if (isValidUrl(pasteText)) {
      const hydration = detectAndHydrate(pasteText);
      if (hydration) {
        // Only auto-hydrate if the text field is empty or just contains the URL
        if (!text.trim() || text.trim() === pasteText) {
          if (hydration.type) setSelectedType(hydration.type);
          if (hydration.content) setText(hydration.content);
          // In a real app, we might fetch the title from an API here
        }
      }
    }
  }

  function isValidUrl(str: string) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  function detectAndHydrate(url: string) {
    // GitHub PR/Issue
    const githubMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)/);
    if (githubMatch) {
      const [_, org, repo, type, num] = githubMatch;
      return {
        type: type === 'pull' ? 'work_log' as EntryType : 'issue' as EntryType,
        content: `[${org}/${repo}] ${type === 'pull' ? 'PR' : 'Issue'} #${num}\n\n${url}`,
      };
    }

    // Linear
    const linearMatch = url.match(/linear\.app\/([^/]+)\/issue\/([^-]+)-(\d+)/);
    if (linearMatch) {
      const [_, _team, proj, num] = linearMatch;
      return {
        type: 'task' as EntryType,
        content: `[${proj}-${num}] Linear Issue\n\n${url}`,
      };
    }

    // Jira
    const jiraMatch = url.match(/atlassian\.net\/browse\/([^-]+)-(\d+)/);
    if (jiraMatch) {
      const [_, proj, num] = jiraMatch;
      return {
        type: 'task' as EntryType,
        content: `[${proj}-${num}] Jira Ticket\n\n${url}`,
      };
    }

    return null;
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    const durationMin = duration.trim() ? parseInt(duration, 10) : undefined;
    await submit({
      text,
      hintType: selectedType ?? undefined,
      durationMinutes: durationMin && !isNaN(durationMin) ? durationMin : undefined,
    });
    setText('');
    setSelectedType(null);
    setDuration('');
    onSuccess?.();
    
    // Reset height if minimal
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Templates / Extra Controls */}
      {(showTemplates || !minimal) && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <TemplatePicker selected={selectedType} onSelect={applyTemplate} />
        </div>
      )}

      <div className={`flex flex-col ${minimal ? '' : 'border border-border rounded-xl bg-card shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'} overflow-hidden`}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={minimal ? "Log something..." : "What's on your mind? (Cmd+Enter to save)"}
            rows={minimal ? 1 : 4}
            className={`w-full p-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground resize-none border-none outline-none font-sans leading-relaxed max-h-64 overflow-y-auto ${minimal ? 'pr-10' : ''}`}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
          
          {minimal && !text.trim() && (
            <div className="absolute right-3 top-3 pointer-events-none opacity-40">
              <kbd className="text-[10px] font-sans">⌘↵</kbd>
            </div>
          )}
        </div>

        {/* Proactive Resurfacing UI */}
        {relatedMemories.length > 0 && (
          <div className="px-3 pb-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Brain size={10} className="text-primary/60" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Related Context</span>
              {isSearching && <Spinner size={8} className="ml-1 opacity-40" />}
            </div>
            <div className="flex flex-col gap-1">
              {relatedMemories.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => window.open(`/entries?id=${m.id}`, '_blank')}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all text-left group"
                >
                  <EntryTypeBadge type={m.entry_type} className="scale-75 origin-left" />
                  <span className="text-[11px] text-foreground/70 truncate flex-1 leading-none">
                    {m.raw_text.split('\n')[0].slice(0, 80)}
                  </span>
                  <ArrowRight size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`flex items-center justify-between px-2 py-1.5 ${minimal ? '' : 'border-t border-border/50 bg-faint/30'}`}>
          <div className="flex items-center gap-1">
            {minimal && (
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className={`p-2 rounded-lg transition-all ${showTemplates ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
                title="Use Template"
              >
                <Sparkles size={18} />
              </button>
            )}

            {selectedType === 'work_log' && (
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border/50">
                <Clock size={14} className="text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="min"
                  className="w-12 px-1 py-0.5 text-xs bg-transparent border-none focus:outline-none text-foreground font-medium"
                />
              </div>
            )}
            
            {selectedType && !minimal && (
              <div className="ml-2 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                {selectedType.replace('_', ' ')}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--color-primary),white_25%)] transition-colors disabled:opacity-30 shadow-lg shadow-primary/20"
            aria-label="Save entry"
          >
            {loading ? <Spinner size={14} /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
