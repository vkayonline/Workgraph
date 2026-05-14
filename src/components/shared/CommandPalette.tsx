import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  FileText, 
  Zap,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import { useEntries } from '../../hooks/useEntries';
import { Badge } from './Badge';
import { embedText } from '../../lib/llm/embed';
import { topK } from '../../lib/search/cosine';

interface CommandItem {
  id: string;
  icon: React.ElementType;
  label: string;
  subtitle?: string;
  category: string;
  action: () => void;
  shortcut?: string;
  badge?: string;
  score?: number;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [semanticResults, setSemanticResults] = useState<CommandItem[]>([]);
  const [, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { entries } = useEntries();

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setSemanticResults([]);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Semantic search logic (debounced)
  useEffect(() => {
    if (!query.trim() || query.length < 4) {
      setSemanticResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const queryVector = await embedText(query);
        const top = topK(queryVector, entries, 3);
        
        const results: CommandItem[] = top.map(e => ({
          id: `semantic-${e.id}`,
          icon: Sparkles,
          label: e.raw_text.split('\n')[0].slice(0, 60) || 'Untitled Entry',
          subtitle: `Semantic Match · ${new Date(e.timestamp).toLocaleDateString()}`,
          category: 'AI Recommended',
          badge: e.entry_type,
          action: () => navigate(`/entries?id=${e.id}`)
        }));
        setSemanticResults(results);
      } catch (err) {
        console.error('Semantic search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [query, entries, navigate]);

  const items: CommandItem[] = useMemo(() => {
    const staticItems: CommandItem[] = [
      { id: 'nav-home', icon: LayoutDashboard, label: 'Go to Today', category: 'Navigation', action: () => navigate('/') },
      { id: 'nav-entries', icon: Clock, label: 'Go to Timeline', category: 'Navigation', action: () => navigate('/entries') },
      
      { id: 'act-log', icon: Plus, label: 'Create Work Log', category: 'Actions', action: () => window.dispatchEvent(new CustomEvent('workgraph:open-capture', { detail: { type: 'work_log' } })) },
      { id: 'act-issue', icon: Zap, label: 'Report Issue', category: 'Actions', action: () => window.dispatchEvent(new CustomEvent('workgraph:open-capture', { detail: { type: 'issue' } })) },
    ];

    // Filter by query
    const filteredStatic = staticItems.filter(i => 
      i.label.toLowerCase().includes(query.toLowerCase()) || 
      i.category.toLowerCase().includes(query.toLowerCase())
    );

    // Keyword search entries
    const keywordResults: CommandItem[] = entries
      .filter(e => e.raw_text.toLowerCase().includes(query.toLowerCase()) && query.length > 1)
      .slice(0, 5)
      .map(e => ({
        id: `entry-${e.id}`,
        icon: FileText,
        label: e.raw_text.split('\n')[0].slice(0, 60) || 'Untitled Entry',
        subtitle: new Date(e.timestamp).toLocaleDateString(),
        category: 'Keyword Match',
        badge: e.entry_type,
        action: () => navigate(`/entries?id=${e.id}`)
      }));

    // Combine: Semantic results first (if any), then filtered static, then keyword
    const combined = [...semanticResults, ...filteredStatic, ...keywordResults];
    
    // De-duplicate if an entry shows up in both semantic and keyword
    const seen = new Set();
    return combined.filter(item => {
      const entryId = item.id.split('-')[1];
      if (entryId && seen.has(entryId)) return false;
      if (entryId) seen.add(entryId);
      return true;
    });
  }, [query, navigate, entries, semanticResults]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, items, selectedIndex, onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    const el = scrollRef.current?.children[selectedIndex] as HTMLElement;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center px-4 border-b border-border/50 h-14 bg-background/50">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
            placeholder="Type a command or search memories..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 ml-2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground border border-border/50 rounded">ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2" ref={scrollRef}>
          {items.length > 0 ? (
            items.reduce((acc: React.ReactNode[], item, index) => {
              const prevItem = items[index - 1];
              const showCategory = !prevItem || prevItem.category !== item.category;

              if (showCategory) {
                acc.push(
                  <div key={`cat-${item.category}`} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-70">
                    {item.category}
                  </div>
                );
              }

              acc.push(
                <button
                  key={item.id}
                  className={`w-full flex items-center px-4 py-2.5 text-left transition-colors group ${
                    selectedIndex === index ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                >
                  <div className={`p-1.5 rounded-lg mr-3 ${
                    selectedIndex === index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'
                  }`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className={`text-sm font-medium truncate ${
                      selectedIndex === index ? 'text-primary' : 'text-foreground'
                    }`}>
                      {item.label}
                    </span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {item.badge && <Badge className="text-[10px] py-0">{item.badge}</Badge>}
                    {selectedIndex === index && <ArrowRight className="w-4 h-4 text-primary animate-in slide-in-from-left-2" />}
                  </div>
                </button>
              );
              return acc;
            }, [])
          ) : (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted border border-border/50 rounded">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted border border-border/50 rounded">ENTER</kbd> Select
            </span>
          </div>
          <div>
            Recall Operational Memory
          </div>
        </div>
      </div>
    </div>
  );
}
