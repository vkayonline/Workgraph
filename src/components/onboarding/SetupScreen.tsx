import { useState, useEffect, type FormEvent } from 'react';
import { Hexagon, Globe, Key, User, Monitor, Cpu, RefreshCw, ChevronLeft } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { Button } from '../shared/Button';
import { ErrorBanner } from '../shared/ErrorBanner';
import { Spinner } from '../shared/Spinner';
import { listModels } from '../../lib/llm/models';

const PRESET_PROVIDERS = [
  { label: 'OpenAI',      url: 'https://api.openai.com/v1' },
  { label: 'OpenRouter',  url: 'https://openrouter.ai/api/v1' },
  { label: 'Groq',        url: 'https://api.groq.com/openai/v1' },
  { label: 'Ollama',      url: 'http://localhost:11434/v1' },
];

export function SetupScreen() {
  const { settings, update } = useSettingsContext();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(settings.userProfile.name);
  const [dayToDay, setDayToDay] = useState(settings.userProfile.dayToDay);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState(settings.model);
  
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState('');

  // Auto-load models when provider info is likely complete
  useEffect(() => {
    if (step === 2 && apiKey.trim() && baseUrl.trim() && availableModels.length === 0) {
      loadModels();
    }
  }, [step]);

  async function loadModels() {
    if (!apiKey.trim() || !baseUrl.trim()) return;
    
    setIsLoadingModels(true);
    setError('');
    try {
      const models = await listModels(apiKey.trim(), baseUrl.trim());
      setAvailableModels(models.map(m => m.id));
      if (models.length > 0) {
        if (!models.some(m => m.id === model)) {
          setModel(models[0].id);
        }
      }
    } catch (err) {
      // Soft handle: show error but don't block
      setError('Could not reach provider to load models. Please check your credentials.');
    } finally {
      setIsLoadingModels(false);
    }
  }

  function handleNext(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!dayToDay.trim()) { setError('Please describe what you do day to day.'); return; }
    setError('');
    setStep(2);
  }

  function handleComplete(e: FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) { setError('Please enter your API key.'); return; }
    if (!baseUrl.trim()) { setError('Please enter a base URL.'); return; }
    if (!model.trim()) { setError('Please select a model.'); return; }
    
    update({
      userProfile: { name: name.trim(), dayToDay: dayToDay.trim() },
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model: model.trim(),
    });
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0 focus-visible:border-transparent transition-all shadow-sm';
  const labelClass = 'text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2';

  return (
    <div className="min-h-dvh bg-faint flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <div className="w-4 h-4 bg-primary-foreground rounded-full" />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">WorkGraph</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={`h-1 w-8 rounded-full transition-all duration-300 ${step === 1 ? 'bg-primary w-12' : 'bg-border'}`} />
            <div className={`h-1 w-8 rounded-full transition-all duration-300 ${step === 2 ? 'bg-primary w-12' : 'bg-border'}`} />
          </div>
        </div>

        {error && <div className="mb-6"><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className={labelClass}>
                  <User size={12} /> Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prasath"
                  autoFocus
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="dayToDay" className={labelClass}>
                  <Monitor size={12} /> Role & Context
                </label>
                <textarea
                  id="dayToDay"
                  value={dayToDay}
                  onChange={(e) => setDayToDay(e.target.value)}
                  placeholder="e.g. Senior Developer focusing on AI tools..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-4 h-12 text-base font-bold shadow-xl shadow-primary/20">
              Continue to AI Setup →
            </Button>
          </form>
        ) : (
          <form onSubmit={handleComplete} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider mb-2"
              >
                <ChevronLeft size={14} /> Back to Profile
              </button>

              <div className="space-y-2">
                <label className={labelClass}>
                  <RefreshCw size={12} /> Select Provider
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_PROVIDERS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setBaseUrl(p.url);
                        if (apiKey) setTimeout(loadModels, 10);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold border rounded-md transition-all shadow-sm ${
                        baseUrl === p.url 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'bg-background border-border hover:border-primary text-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="baseUrl" className={labelClass}>
                  <Globe size={12} /> Base URL
                </label>
                <input
                  id="baseUrl"
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  onBlur={() => { if (apiKey) loadModels(); }}
                  placeholder="https://api.openai.com/v1"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="apiKey" className={labelClass}>
                  <Key size={12} /> API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onBlur={() => { if (baseUrl) loadModels(); }}
                  placeholder="sk-..."
                  className={inputClass}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50">
                <label htmlFor="model" className={labelClass}>
                  <Cpu size={12} /> {isLoadingModels ? <Spinner size={10} className="mr-1" /> : null} Choose Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={`${inputClass} appearance-none bg-no-repeat bg-[right_0.75rem_center] cursor-pointer`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1rem' }}
                >
                  {availableModels.length > 0 ? (
                    availableModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))
                  ) : (
                    <option value={model}>{model}</option>
                  )}
                </select>
                <button 
                  type="button" 
                  onClick={loadModels}
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  Refresh models
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-4 h-12 text-base font-bold shadow-xl shadow-primary/20">
              Complete Setup →
            </Button>
          </form>
        )}

        <p className="text-[10px] text-center text-muted-foreground/60 mt-6 uppercase tracking-widest font-bold">
          Privacy First • 100% Local Storage
        </p>
      </div>
    </div>
  );
}

