import type { Template } from '../types';

export const TEMPLATES: Template[] = [
  {
    id: 'meeting',
    name: 'Meeting Note',
    entry_type: 'meeting_note',
    content: '## Meeting\n\n**Attendees:** \n\n**Agenda:**\n- \n\n**Key points:**\n- \n\n**Action items:**\n- ',
  },
  {
    id: 'decision',
    name: 'Decision',
    entry_type: 'decision',
    content: '## Decision\n\n**We decided to:** \n\n**Because:** \n\n**Alternatives considered:**\n- \n\n**Trade-offs:** ',
  },
  {
    id: 'blocker',
    name: 'Blocker',
    entry_type: 'blocker',
    content: '## Blocker\n\n**Blocked on:** \n\n**Impact:** \n\n**Who needs to unblock:** \n\n**Workaround (if any):** ',
  },
  {
    id: 'weekly-goal',
    name: 'Weekly Goal',
    entry_type: 'task',
    content: '## Week of \n\n**Goals:**\n- \n\n**Done by Friday:**\n- ',
  },
];
