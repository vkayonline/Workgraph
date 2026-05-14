import { useState, useRef, useEffect } from 'react';
import { User, Cpu, Database, Hexagon, X, RefreshCw, Globe, Key, ShieldCheck, Monitor } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { Button } from '../shared/Button';
import { ErrorBanner } from '../shared/ErrorBanner';
import { Modal } from '../shared/Modal';
import { Spinner } from '../shared/Spinner';
import { clearAllEntries } from '../../lib/db/entries';
import { exportToJSON } from '../../lib/transfer/jsonExport';
import { importFromJSON } from '../../lib/transfer/jsonImport';
import { listModels } from '../../lib/llm/models';
import type { Settings } from '../../types';

const PRESET_PROVIDERS = [
  { label: 'OpenAI',      url: 'https://api.openai.com/v1' },
  { label: 'OpenRouter',  url: 'https://openrouter.ai/api/v1' },
  { label: 'Groq',        url: 'https://api.groq.com/openai/v1' },
  { label: 'Ollama',      url: 'http://localhost:11434/v1' },
];

const inputClass = 'w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm';
const subtextClass = 'text-xs text-muted-foreground leading-relaxed';

type Section = 'profile' | 'llm' | 'data';

// Helper to get the relevant slice of settings for comparison
const getSettingsSlice = (s: Settings) => ({
  name: s.userProfile.name,
  dayToDay: s.userProfile.dayToDay,
  apiKey: s.apiKey,
  baseUrl: s.baseUrl,
  model: s.model,
});

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update } = useSettingsContext();
  const [tab, setTab] = useState<Section>('profile');
  const [state, setState] = useState(getSettingsSlice(settings));
  
  const [loadingModels, setLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens to ensure it's fresh
  useEffect(() => {
    if (open) {
      setState(getSettingsSlice(settings));
    }
  }, [open, settings]);

  const isDirty = JSON.stringify(state) !== JSON.stringify(getSettingsSlice(settings));

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleLoadModels = async () => {
    if (!state.apiKey.trim() || !state.baseUrl.trim()) {
      setError('Enter API key and base URL first.');
      return;
    }
    setLoadingModels(true);
    setError('');
    try {
      const models = await listModels(state.apiKey.trim(), state.baseUrl.trim());
      setAvailableModels(models.map(m => m.id));
    } catch {
      setError('Failed to load models. Check your API key and base URL.');
    } finally {
      setLoadingModels(false);
    }
  };

  const save = () => {
    update({
      apiKey: state.apiKey.trim(),
      baseUrl: state.baseUrl.trim(),
      model: state.model.trim(),
      userProfile: { name: state.name.trim(), dayToDay: state.dayToDay.trim() }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000); // Show saved state for 2 seconds
  };


  const navItems = [
    { id: 'profile',    label: 'Profile',    icon: User },
    { id: 'llm',        label: 'AI Provider', icon: Cpu },
    { id: 'data',       label: 'Data',       icon: Database },
  ];

  return (
    <Modal open={open} onClose={handleClose} className="max-w-5xl h-[85vh] overflow-hidden flex flex-col md:flex-row p-0">
      <div className="flex h-full w-full">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 border-r border-border bg-[var(--color-sidebar)] flex-col shrink-0">
          <div className="p-6 border-b border-border/50 flex items-center gap-2.5">
            <Hexagon size={20} className="text-primary" strokeWidth={2.5} />
            <h2 className="text-base font-bold tracking-tight">Settings</h2>
          </div>
          
          <nav className="p-3 flex flex-col gap-1">
            {navItems.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Section)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                  tab === t.id 
                    ? 'bg-[var(--color-sidebar-item-active)] text-foreground font-semibold shadow-sm' 
                    : 'text-foreground/60 hover:bg-[var(--color-sidebar-item-hover)] hover:text-foreground hover:translate-x-1'
                }`}
              >
                <t.icon size={18} className={tab === t.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto p-6 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Local-First Journal</p>
            <p className="text-[10px] text-muted-foreground/60">Version 1.0.0</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {/* Mobile Header & Nav */}
          <div className="md:hidden border-b border-border bg-[var(--color-sidebar)]">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Hexagon size={18} className="text-primary" />
                <h2 className="text-sm font-bold">Settings</h2>
              </div>
              <button onClick={handleClose} className="p-1"><X size={20} /></button>
            </div>
            <nav className="flex overflow-x-auto">
              {navItems.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Section)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
                    tab === t.id 
                      ? 'border-b-2 border-primary text-primary font-semibold' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <main className="flex-1 overflow-y-auto p-6 md:p-12">
            {error && <div className="mb-8"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

            {tab === 'profile' && (
              <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-3xl font-bold tracking-tight mb-2">Profile</h3>
                  <p className="text-muted-foreground">Customize your personal identity within the journal.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <User size={14} className="text-primary" /> Display Name
                    </label>
                    <input className={inputClass} value={state.name} onChange={e => setState({...state, name: e.target.value})} placeholder="How should I call you?" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Monitor size={14} className="text-primary" /> Role & Context
                    </label>
                    <p className={subtextClass}>This description provides the LLM with the context it needs to accurately classify your work logs and meeting notes.</p>
                    <textarea className={inputClass} rows={6} value={state.dayToDay} onChange={e => setState({...state, dayToDay: e.target.value})} placeholder="e.g. Senior Frontend Engineer focusing on React and AI integration..." />
                  </div>
                </div>
              </div>
            )}

            {tab === 'llm' && (
              <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-3xl font-bold tracking-tight mb-2">AI Provider</h3>
                  <p className="text-muted-foreground">Configure your intelligence engine. Supports OpenAI, Ollama, and other compatible APIs.</p>
                </div>

                <div className="space-y-8">
                  {/* Presets */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <RefreshCw size={14} /> Quick Presets
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_PROVIDERS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => setState({ ...state, baseUrl: p.url })}
                          className="px-3 py-1.5 text-xs font-medium bg-card border border-border rounded-md hover:border-primary hover:text-primary transition-all shadow-sm"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Base URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Globe size={14} className="text-primary" /> Base URL
                    </label>
                    <input
                      className={inputClass}
                      value={state.baseUrl}
                      onChange={(e) => setState({ ...state, baseUrl: e.target.value })}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>

                  {/* API Key */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Key size={14} className="text-primary" /> API Key
                    </label>
                    <input
                      type="password"
                      className={inputClass}
                      value={state.apiKey}
                      onChange={(e) => setState({ ...state, apiKey: e.target.value })}
                      placeholder="sk-..."
                    />
                    <p className={subtextClass}>Your key is stored securely in your browser's local storage.</p>
                  </div>

                  {/* Model Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <Cpu size={14} className="text-primary" /> Chat Model
                      </label>
                      <div className="relative">
                        <select
                          className={`${inputClass} appearance-none bg-no-repeat bg-[right_0.75rem_center] cursor-pointer`}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1rem' }}
                          value={state.model}
                          onChange={(e) => setState({ ...state, model: e.target.value })}
                        >
                          {availableModels.length > 0 ? (
                            availableModels.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))
                          ) : (
                            <option value={state.model}>{state.model}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary" /> Embeddings
                      </label>
                      <div className="flex bg-faint p-3 rounded-lg border border-border items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-foreground leading-none mb-1">Local-Only (GTE)</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">Always private. No data sent to provider for search.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLoadModels}
                    disabled={loadingModels}
                    className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition-all"
                  >
                    {loadingModels ? <Spinner size={12} /> : <RefreshCw size={12} />}
                    Refresh Available Models
                  </button>
                </div>
              </div>
            )}

            {tab === 'data' && (
              <div className="max-w-2xl space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h3 className="text-3xl font-bold tracking-tight mb-2">Data Management</h3>
                  <p className="text-muted-foreground">You are in full control of your data. Export, import, or purge your local database here.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Export */}
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Database size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Export Data</h4>
                      <p className={subtextClass}>Download your entire journal as a JSON file for backup or portability.</p>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full mt-2 font-bold"
                      onClick={() => exportToJSON()}
                    >
                      Download JSON
                    </Button>
                  </div>

                  {/* Import */}
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <RefreshCw size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Import Data</h4>
                      <p className={subtextClass}>Restore your journal from a previous backup. This will merge with existing data.</p>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full mt-2 font-bold"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          await importFromJSON(file);
                          alert('Import successful!');
                          window.location.reload();
                        } catch {
                          setError('Failed to import data. Ensure the file is a valid Recall export.');
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-border/50">
                  <div className="bg-danger/5 border border-danger/20 rounded-xl p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                      <X size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-danger mb-1">Purge Local Database</h4>
                      <p className="text-xs text-danger/70 max-w-sm">This action is irreversible. All entries, images, and embeddings will be permanently deleted from this device.</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Are you ABSOLUTELY sure? All your data will be permanently deleted.')) {
                          await clearAllEntries();
                          window.location.reload();
                        }
                      }}
                      className="px-6 py-2 bg-danger text-danger-foreground text-xs font-bold uppercase tracking-widest rounded-md hover:bg-danger/90 transition-all shadow-lg shadow-danger/20"
                    >
                      Delete Everything
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-end items-center gap-4 bg-[var(--color-sidebar)]/30 backdrop-blur-md">
            <button onClick={handleClose} className="px-6 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <Button onClick={save} disabled={!isDirty || saved} size="lg" className="min-w-[160px] shadow-xl shadow-primary/20 rounded-xl h-11">
              {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}