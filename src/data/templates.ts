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
    id: 'issue',
    name: 'Issue',
    entry_type: 'issue',
    content: '## Issue\n\n**Description:** \n\n**Impact:** \n\n**Potential solutions:** \n- \n\n**Next steps:** ',
  },
  {
    id: 'weekly-goal',
    name: 'Weekly Goal',
    entry_type: 'task',
    content: '## Week of \n\n**Goals:**\n- \n\n**Done by Friday:**\n- ',
  },
];
