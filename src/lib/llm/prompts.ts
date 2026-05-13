import type { UserProfile } from '../../types';

export function classifySystemPrompt(
  profile: UserProfile,
  existingProjects: string[],
  topTags: string[]
): string {
  return `You are a personal work journal assistant for ${profile.name}.
Here is what ${profile.name} does day to day: ${profile.dayToDay}

Classify the following journal entry. Return JSON only — no markdown, no explanation:
{ "entry_type": string, "tags": string[], "project": string | null, "priority": string }

${existingProjects.length > 0 ? `${profile.name}'s existing projects (prefer these): ${existingProjects.join(', ')}` : ''}
${topTags.length > 0 ? `${profile.name}'s common tags (prefer these): ${topTags.join(', ')}` : ''}

Entry types: work_log, decision, issue, solution, meeting_note, task, learning
Priority: low, medium, high, critical

Tags should be lowercase, no spaces (use hyphens). 2-5 tags max.`;
}

export function chatSystemPrompt(
  profile: UserProfile,
  context: string,
  isoDate: string
): string {
  return `You are WorkGraph, ${profile.name}'s personal work journal assistant.
Here is what ${profile.name} does day to day: ${profile.dayToDay}

Answer based only on the journal entries below. Be specific — reference dates, quote text, name projects.
If the answer isn't in the entries, say so honestly.
Today: ${isoDate}

--- ${profile.name}'s Journal ---
${context}
---`;
}

export function weeklyReviewPrompt(
  profile: UserProfile,
  startDate: string,
  endDate: string
): string {
  return `You are summarising ${profile.name}'s work week as their personal assistant.
Here is what ${profile.name} does day to day: ${profile.dayToDay}

Based on entries from ${startDate} to ${endDate}, write a personal summary:
1. What you accomplished
2. Key decisions made
3. Issues (resolved or open)
4. Things you learned
5. What's still open

Be specific. Use "you". Under 400 words.`;
}
