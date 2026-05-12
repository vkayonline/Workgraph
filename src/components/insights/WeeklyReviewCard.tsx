import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { streamWeeklyReview } from '../../lib/llm/chat';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Button } from '../shared/Button';
import { Spinner } from '../shared/Spinner';
import type { JournalEntry } from '../../types';

interface WeeklyReviewCardProps {
  entries: JournalEntry[];
  startDate: string;
  endDate: string;
}

export function WeeklyReviewCard({ entries, startDate, endDate }: WeeklyReviewCardProps) {
  const { settings } = useSettingsContext();
  const online = useNetworkStatus();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (!settings.apiKey || !online || entries.length === 0) return;
    setLoading(true);
    setError('');
    setText('');
    try {
      await streamWeeklyReview({
        entries,
        startDate,
        endDate,
        profile: settings.userProfile,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
        onToken: (t) => setText((prev) => prev + t),
      });
    } catch {
      setError('Failed to generate review. Check your API key and connection.');
    }
    setLoading(false);
  }

  const canGenerate = !loading && !!settings.apiKey && online && entries.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {!text && !loading && (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-muted-foreground text-center">
            {entries.length === 0
              ? 'No entries in the selected range.'
              : `${entries.length} entries ready for review.`}
          </p>
          <Button onClick={generate} disabled={!canGenerate} className="flex items-center gap-2">
            <Sparkles size={14} />
            Generate review
          </Button>
          {!settings.apiKey && (
            <p className="text-xs text-muted-foreground">Add an API key in Settings to use this.</p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-2">
          {text ? (
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {text}
              <span className="stream-cursor" />
            </div>
          ) : (
            <div className="flex items-center gap-2 py-6 justify-center text-sm text-muted-foreground">
              <Spinner size={14} />
              Generating…
            </div>
          )}
        </div>
      )}

      {!loading && text && (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{text}</div>
          <Button
            variant="ghost"
            onClick={generate}
            disabled={!canGenerate}
            className="self-start flex items-center gap-1.5 text-xs"
          >
            <Sparkles size={12} />
            Regenerate
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
