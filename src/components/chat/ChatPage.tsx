import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { getAllEntries } from '../../lib/db/entries';
import { streamChatTurn } from '../../lib/llm/chat';
import { embedText } from '../../lib/llm/embed';
import { topK } from '../../lib/search/cosine';
import { Spinner } from '../shared/Spinner';
import { ErrorBanner } from '../shared/ErrorBanner';
import { SourceCitations } from './SourceCitations';
import type { ChatMessage, JournalEntry } from '../../types';

const EXAMPLES = [
  'What blockers have I logged this week?',
  'What decisions did I make last month?',
  'What am I currently working on?',
];

// Custom event name used by AppShell Cmd+/ shortcut to focus this textarea
export const FOCUS_CHAT_INPUT_EVENT = 'workgraph:focus-chat-input';

export function ChatPage() {
  const { settings } = useSettingsContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Map from message id → relevant entries shown as citations
  const [citations, setCitations] = useState<Map<string, JournalEntry[]>>(new Map());
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when Cmd+/ fires from anywhere in the app
  useEffect(() => {
    const handler = () => inputRef.current?.focus();
    window.addEventListener(FOCUS_CHAT_INPUT_EVENT, handler);
    return () => window.removeEventListener(FOCUS_CHAT_INPUT_EVENT, handler);
  }, []);

  const send = useCallback(async (question: string) => {
    if (!question.trim() || streaming) return;
    setError('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question.trim(),
      created_at: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', created_at: Date.now() },
    ]);
    setStreaming(true);

    try {
      const allEntries = await getAllEntries();
      const relevant = await pickRelevant(allEntries, question, settings);

      // Attach citations immediately so they appear as soon as streaming starts
      if (relevant.length > 0) {
        setCitations((prev) => new Map(prev).set(assistantId, relevant));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, cited_entry_ids: relevant.map((e) => e.id) }
              : m
          )
        );
      }

      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

      await streamChatTurn({
        question: question.trim(),
        history,
        relevantEntries: relevant,
        profile: settings.userProfile,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + token } : m))
          );
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed. Check your API key.');
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      setCitations((prev) => { const next = new Map(prev); next.delete(assistantId); return next; });
    } finally {
      setStreaming(false);
    }
  }, [settings, streaming, messages]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-0" style={{ height: 'calc(100dvh - 8rem)' }}>
      <h1 className="text-xl font-semibold text-foreground mb-4 shrink-0">
        Chat with your journal
      </h1>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 mt-8">
            <p className="text-sm text-muted-foreground text-center">
              Ask anything about your work journal
            </p>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  className="text-left text-sm px-4 py-3 border border-border rounded-md hover:bg-accent transition-colors text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={['flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start'].join(' ')}
          >
            <div
              className={[
                'max-w-[80%] px-4 py-3 rounded-md text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground',
              ].join(' ')}
            >
              <span className={streaming && msg.role === 'assistant' && !msg.content ? 'stream-cursor' : ''}>
                {msg.content || (streaming ? '' : '...')}
              </span>
            </div>
            {msg.role === 'assistant' && citations.has(msg.id) && (
              <div className="max-w-[80%] w-full px-1">
                <SourceCitations entries={citations.get(msg.id)!} />
              </div>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="shrink-0 mt-2">
          <ErrorBanner message={error} onDismiss={() => setError('')} />
        </div>
      )}

      <div className="shrink-0 mt-4 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything… (Cmd+Enter to send)"
          rows={2}
          className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0"
        />
        <button
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          className="h-10 w-10 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--color-primary),white_25%)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Send"
        >
          {streaming ? <Spinner size={16} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

async function pickRelevant(
  entries: JournalEntry[],
  question: string,
  settings: ReturnType<typeof import('../../contexts/SettingsContext').useSettingsContext>['settings'],
): Promise<JournalEntry[]> {
  const embeddedEntries = entries.filter((e) => e.embedding_vector !== null);

  if (embeddedEntries.length >= 3 && settings.apiKey && settings.embeddingModel) {
    try {
      const vector = await embedText(question, settings.apiKey, settings.baseUrl, settings.embeddingModel);
      return topK(vector, entries, 8);
    } catch {
      // fall through to keyword scoring
    }
  }

  const q = question.toLowerCase();
  return entries
    .map((e) => {
      let score = 0;
      if (e.raw_text.toLowerCase().includes(q)) score += 3;
      if (e.tags.some((t) => q.includes(t))) score += 2;
      if (e.project?.toLowerCase() && q.includes(e.project.toLowerCase())) score += 2;
      score += 1 / (1 + (Date.now() - e.created_at) / 86400000);
      return { e, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ e }) => e);
}
