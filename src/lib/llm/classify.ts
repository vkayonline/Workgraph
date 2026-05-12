import { getClient } from './client';
import { classifySystemPrompt } from './prompts';
import type { ClassificationResult, EntryImage, UserProfile } from '../../types';
import { ENTRY_TYPES, PRIORITIES, SENTIMENTS } from '../../types';

const CLASSIFY_TOOL = {
  type: 'function' as const,
  function: {
    name: 'classify_entry',
    description: 'Classify a work journal entry',
    parameters: {
      type: 'object',
      properties: {
        entry_type: { type: 'string', enum: [...ENTRY_TYPES] },
        tags: { type: 'array', items: { type: 'string' }, maxItems: 5 },
        project: { type: ['string', 'null'] },
        priority: { type: 'string', enum: [...PRIORITIES] },
        sentiment: { type: 'string', enum: [...SENTIMENTS] },
      },
      required: ['entry_type', 'tags', 'project', 'priority', 'sentiment'],
      additionalProperties: false,
    },
  },
};

interface ClassifyOptions {
  text: string;
  images: EntryImage[];
  profile: UserProfile;
  apiKey: string;
  baseUrl: string;
  model: string;
  existingProjects: string[];
  topTags: string[];
}

export async function classifyEntry({
  text,
  images,
  profile,
  apiKey,
  baseUrl,
  model,
  existingProjects,
  topTags,
}: ClassifyOptions): Promise<ClassificationResult> {
  const client = getClient(apiKey, baseUrl);

  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } };

  const content: ContentPart[] = [];
  if (text.trim()) content.push({ type: 'text', text: text.trim() });
  for (const img of images) {
    content.push({ type: 'image_url', image_url: { url: img.data_url } });
  }

  const resp = await client.chat.completions.create({
    model,
    max_tokens: 256,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: 'function', function: { name: 'classify_entry' } },
    messages: [
      { role: 'system', content: classifySystemPrompt(profile, existingProjects, topTags) },
      { role: 'user', content },
    ],
  });

  const toolCall = resp.choices[0]?.message?.tool_calls?.[0];
  const raw = (toolCall && 'function' in toolCall ? toolCall.function.arguments : null) ?? '{}';
  const parsed = JSON.parse(raw);

  return {
    entry_type: ENTRY_TYPES.includes(parsed.entry_type) ? parsed.entry_type : 'work_log',
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    project: typeof parsed.project === 'string' && parsed.project ? parsed.project : null,
    priority: PRIORITIES.includes(parsed.priority) ? parsed.priority : 'medium',
    sentiment: SENTIMENTS.includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
  };
}
