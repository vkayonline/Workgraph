import { getClient } from './client';
import { replaySystemPrompt, weeklyReviewPrompt } from './prompts';
import type { JournalEntry, UserProfile } from '../../types';

interface ReplayOptions {
  question: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  relevantEntries: JournalEntry[];
  profile: UserProfile;
  apiKey: string;
  baseUrl: string;
  model: string;
  onToken: (token: string) => void;
}

export async function streamReplayTurn({
  question,
  history,
  relevantEntries,
  profile,
  apiKey,
  baseUrl,
  model,
  onToken,
}: ReplayOptions): Promise<string> {
  const client = getClient(apiKey, baseUrl);
  const isoDate = new Date().toISOString().slice(0, 10);

  const context = relevantEntries
    .map((e: JournalEntry) => {
      const date = new Date(e.created_at).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
      return `[${e.entry_type}] ${date}\n${e.raw_text}`;
    })
    .join('\n\n---\n\n');

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: replaySystemPrompt(profile, context, isoDate) },
    ...history,
    { role: 'user', content: question },
  ];

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 1024,
    stream: true,
    messages,
  });

  let full = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      onToken(delta);
      full += delta;
    }
  }
  return full;
}

interface WeeklyReviewOptions {
  entries: JournalEntry[];
  startDate: string;
  endDate: string;
  profile: UserProfile;
  apiKey: string;
  baseUrl: string;
  model: string;
  onToken: (token: string) => void;
}

export async function streamWeeklyReview({
  entries,
  startDate,
  endDate,
  profile,
  apiKey,
  baseUrl,
  model,
  onToken,
}: WeeklyReviewOptions): Promise<string> {
  const client = getClient(apiKey, baseUrl);
  const context = entries
    .map((e) => {
      const date = new Date(e.created_at).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
      return `[${e.entry_type}] ${date}\n${e.raw_text}`;
    })
    .join('\n\n---\n\n');

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 800,
    stream: true,
    messages: [
      { role: 'system', content: weeklyReviewPrompt(profile, startDate, endDate) },
      { role: 'user', content: `Here are the journal entries:\n\n${context}` },
    ],
  });

  let full = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      onToken(delta);
      full += delta;
    }
  }
  return full;
}
