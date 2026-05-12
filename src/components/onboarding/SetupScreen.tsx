import { useState, type FormEvent } from 'react';
import { Hexagon } from 'lucide-react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { Button } from '../shared/Button';
import { ErrorBanner } from '../shared/ErrorBanner';

export function SetupScreen() {
  const { settings, update } = useSettingsContext();
  const [name, setName] = useState(settings.userProfile.name);
  const [dayToDay, setDayToDay] = useState(settings.userProfile.dayToDay);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!dayToDay.trim()) { setError('Please describe what you do day to day.'); return; }
    if (!apiKey.trim()) {
      setError('Please enter your API key.'); return;
    }
    update({
      userProfile: { name: name.trim(), dayToDay: dayToDay.trim() },
      apiKey: apiKey.trim(),
    });
  }

  const inputClass =
    'px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0 focus-visible:border-transparent';

  return (
    <div className="min-h-dvh bg-faint flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-md p-8">
        <div className="mb-8 text-center">
          <Hexagon className="mx-auto mb-3 text-primary" size={36} strokeWidth={1.5} />
          <h1 className="text-xl font-semibold text-foreground">WorkGraph</h1>
          <p className="text-sm text-muted-foreground mt-1">Your private work journal</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              What's your name?
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dayToDay" className="text-sm font-medium text-foreground">
              What do you do day to day?
            </label>
            <textarea
              id="dayToDay"
              value={dayToDay}
              onChange={(e) => setDayToDay(e.target.value)}
              placeholder="e.g. I write APIs, review PRs and run team standups"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="apiKey" className="text-sm font-medium text-foreground">
              Anthropic API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className={inputClass}
            />
          </div>

          <Button type="submit" size="lg" className="mt-2">
            Let's go →
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your data never leaves this device.
          </p>
        </form>
      </div>
    </div>
  );
}
