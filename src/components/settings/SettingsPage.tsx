import { useState, useRef } from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { Button } from '../shared/Button';
import { ErrorBanner } from '../shared/ErrorBanner';
import { Spinner } from '../shared/Spinner';
import { clearAllEntries } from '../../lib/db/entries';
import { exportToJSON } from '../../lib/transfer/jsonExport';
import { importFromJSON } from '../../lib/transfer/jsonImport';
import { listModels } from '../../lib/llm/models';
import type { Theme } from '../../types';

const PRESET_PROVIDERS = [
  { label: 'OpenAI',      url: 'https://api.openai.com/v1' },
  { label: 'OpenRouter',  url: 'https://openrouter.ai/api/v1' },
  { label: 'Groq',        url: 'https://api.groq.com/openai/v1' },
  { label: 'Ollama',      url: 'http://localhost:11434/v1' },
];

const inputClass =
  'px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0';

const sectionHeading = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export function SettingsPage() {
  const { settings, update } = useSettingsContext();
  const [name, setName] = useState(settings.userProfile.name);
  const [dayToDay, setDayToDay] = useState(settings.userProfile.dayToDay);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState(settings.model);
  const [embeddingModel, setEmbeddingModel] = useState(settings.embeddingModel);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLoadModels() {
    if (!apiKey.trim() || !baseUrl.trim()) {
      setError('Enter API key and base URL first.'); return;
    }
    setLoadingModels(true);
    try {
      const models = await listModels(apiKey.trim(), baseUrl.trim());
      setAvailableModels(models.map((m) => m.id));
    } catch {
      setError('Could not load models. Check your API key and base URL.');
    } finally {
      setLoadingModels(false);
    }
  }

  function saveProfile() {
    if (!name.trim() || !dayToDay.trim() || !apiKey.trim() || !baseUrl.trim() || !model.trim()) {
      setError('All fields are required.'); return;
    }
    update({
      userProfile: { name: name.trim(), dayToDay: dayToDay.trim() },
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      embeddingModel: embeddingModel.trim() || 'text-embedding-3-small',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport() {
    await exportToJSON();
    update({ lastExportAt: Date.now() });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await importFromJSON(file);
      setImportMsg(`Imported ${count} entries.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    }
    e.target.value = '';
  }

  async function handleClearData() {
    if (!confirm('Delete all entries? This cannot be undone.')) return;
    await clearAllEntries();
    setImportMsg('All entries deleted.');
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-foreground">Settings</h1>

      {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

      {/* Profile */}
      <section className="flex flex-col gap-4">
        <h2 className={sectionHeading}>Profile</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">What you do day to day</label>
          <textarea
            value={dayToDay}
            onChange={(e) => setDayToDay(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <Button onClick={saveProfile} className="self-start">
          {saved ? 'Saved ✓' : 'Save changes'}
        </Button>
      </section>

      {/* LLM */}
      <section className="flex flex-col gap-4">
        <h2 className={sectionHeading}>LLM Provider</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">API Base URL</label>
          <div className="flex flex-wrap gap-2 mb-1">
            {PRESET_PROVIDERS.map(({ label, url }) => (
              <button
                key={url}
                onClick={() => setBaseUrl(url)}
                className={[
                  'px-3 py-1 text-xs rounded-full border transition-colors',
                  baseUrl === url
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Chat Model</label>
            <button
              type="button"
              onClick={handleLoadModels}
              disabled={loadingModels}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {loadingModels ? <Spinner size={12} /> : null}
              {loadingModels ? 'Loading…' : 'Load from provider'}
            </button>
          </div>
          {availableModels.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1 max-h-24 overflow-y-auto">
              {availableModels.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setModel(id)}
                  className={[
                    'px-3 py-1 text-xs rounded-full border transition-colors',
                    model === id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
                  ].join(' ')}
                >
                  {id}
                </button>
              ))}
            </div>
          )}
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o-mini"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Embedding Model</label>
          <p className="text-xs text-muted-foreground">Used for semantic search in chat. Must support embeddings.</p>
          {availableModels.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1 max-h-24 overflow-y-auto">
              {availableModels
                .filter((id) => id.toLowerCase().includes('embed'))
                .map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEmbeddingModel(id)}
                    className={[
                      'px-3 py-1 text-xs rounded-full border transition-colors',
                      embeddingModel === id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
                    ].join(' ')}
                  >
                    {id}
                  </button>
                ))}
            </div>
          )}
          <input
            value={embeddingModel}
            onChange={(e) => setEmbeddingModel(e.target.value)}
            placeholder="text-embedding-3-small"
            className={inputClass}
          />
        </div>

        <Button onClick={saveProfile} className="self-start">
          {saved ? 'Saved ✓' : 'Save changes'}
        </Button>
      </section>

      {/* Theme */}
      <section className="flex flex-col gap-4">
        <h2 className={sectionHeading}>Theme</h2>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => update({ theme: t })}
              className={[
                'px-4 py-2 text-sm rounded-md border transition-colors capitalize',
                settings.theme === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-foreground hover:bg-accent',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Data */}
      <section className="flex flex-col gap-4">
        <h2 className={sectionHeading}>Data</h2>

        {importMsg && <p className="text-sm text-success">{importMsg}</p>}

        {settings.lastExportAt && (
          <p className="text-xs text-muted-foreground">
            Last exported: {new Date(settings.lastExportAt).toLocaleDateString()}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport}>Export JSON</Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Import JSON</Button>
          <Button variant="danger" onClick={handleClearData}>Clear all data</Button>
        </div>

        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </section>
    </div>
  );
}
