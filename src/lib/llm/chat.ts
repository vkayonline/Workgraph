import { getClient } from './client';
import { chatSystemPrompt } from './prompts';
import type { JournalEntry, UserProfile } from '../../types';

interface ChatOptions {
  question: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  relevantEntries: JournalEntry[];
  profile: UserProfile;
  apiKey: string;
  baseUrl: string;
  model: string;
  onToken: (token: string) => void;
}

export async function streamChatTurn({
  question,
  history,
  relevantEntries,
  profile,
  apiKey,
  baseUrl,
  model,
  onToken,
}: ChatOptions): Promise<string> {
  const client = getClient(apiKey, baseUrl);
  const isoDate = new Date().toISOString().slice(0, 10);

  const context = relevantEntries
    .map((e) => {
      const date = new Date(e.created_at).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
      return `[${e.entry_type}] ${date}${e.project ? ` · ${e.project}` : ''}\n${e.raw_text}`;
    })
    .join('\n\n---\n\n');

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: chatSystemPrompt(profile, context, isoDate) },
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
