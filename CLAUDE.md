# WorkGraph — Claude Guide

## What This Is
A privacy-first, single-user, local-first PWA work journal. Capture thoughts in under 5 seconds. LLM auto-tags everything. Query your accumulated knowledge conversationally via semantic search. No backend, no auth, no cloud sync — ever.

**Core loop:** Capture → LLM auto-classify → IndexedDB → query via chat

---

## Commands

```bash
pnpm dev          # start dev server (http://localhost:5173)
pnpm build        # tsc + vite build → dist/
pnpm preview      # preview production build
pnpm lint         # eslint
```

Package manager is **pnpm**. Never use npm or yarn.

---

## Tech Stack (exact versions in use)

| Tool | Version | Notes |
|---|---|---|
| React | 19 | New JSX transform — never `import React from 'react'` |
| Vite | 8 | |
| TypeScript | 6 | `erasableSyntaxOnly: true` — **no `enum`**, use `const` objects |
| Tailwind CSS | v4 | CSS-native config — **no `tailwind.config.ts`** |
| `@tailwindcss/vite` | ^4.3 | Handles Tailwind in Vite — already configured |
| pnpm | latest | |

### Tailwind v4 — how it works here
Config lives in `src/index.css` via the `@theme {}` block, not a JS file.

```css
@import "tailwindcss";

@theme {
  --color-background: #ffffff;
  --font-sans: system-ui, -apple-system, sans-serif;
  /* etc. */
}
```

Tailwind generates utility classes (`bg-background`, `font-sans`) automatically from `@theme` tokens. All design tokens are CSS custom properties — one source of truth.

### TypeScript rules
- `erasableSyntaxOnly: true` → **no `enum`**. Use `const` objects with `as const`:
  ```ts
  export const EntryType = { WorkLog: 'work_log', Decision: 'decision' } as const;
  export type EntryType = typeof EntryType[keyof typeof EntryType];
  ```
- `noUnusedLocals` and `noUnusedParameters` are on — clean up unused code
- `verbatimModuleSyntax` — use `import type` for type-only imports

---

## Architecture

### Storage
All data in **IndexedDB** via `idb` library. No server, no API routes.
- DB name: `workgraph`, version 1
- Store: `entries` (keyPath: `id`)
- Schema defined in `src/lib/db/schema.ts`

### LLM
Anthropic Claude API via `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true`.
- API key from `localStorage` — never hardcoded, never sent to any server
- Classification: single non-streaming call, returns JSON
- Chat: streaming via `client.messages.stream()`
- All prompts in `src/lib/llm/prompts.ts` — personalized with user's name + `dayToDay`

### Embeddings
`@xenova/transformers` v2 running in a **Web Worker**.
- Model: `Xenova/all-MiniLM-L6-v2` (quantized int8, ~22 MB)
- Downloaded from HuggingFace on first use, cached in browser Cache API
- Worker: `src/lib/embedding/worker.ts`
- Queue: `src/lib/embedding/queue.ts` — Promise-based, FIFO

### Semantic Search
Brute-force cosine similarity in `src/lib/search/cosine.ts`.
`O(n × 384)` — ~20–50ms at 10k entries, acceptable for personal use.

---

## Design System

**Source of truth: `src/index.css`** — all CSS custom properties defined here via `@theme {}`.

### Palette
```
--color-background:  #ffffff  (dark: #09090b)
--color-foreground:  #09090b  (dark: #fafafa)
--color-card:        #ffffff  (dark: #18181b)
--color-primary:     #574747  ← warm charcoal (oat.ink inspired)
--color-border:      #d4d4d8  (dark: #3f3f46)
--color-muted:       #f4f4f5  (dark: #27272a)
--color-muted-fg:    #71717a  (dark: #a1a1aa)
```

### Entry Type Colors
```
--color-type-work-log:    #6366f1  indigo
--color-type-decision:    #d97706  amber
--color-type-problem:     #dc2626  red
--color-type-solution:    #16a34a  green
--color-type-meeting:     #2563eb  blue
--color-type-task:        #7c3aed  violet
--color-type-learning:    #0891b2  cyan
--color-type-blocker:     #b91c1c  red-dark
--color-type-risk:        #ea580c  orange
```

### Badge Pattern (oat.ink `color-mix()`)
```css
/* soft tinted glass — not flat color fills */
color: var(--color-type-ENTRY_TYPE);
background: color-mix(in srgb, var(--color-type-ENTRY_TYPE), transparent 85%);
border: 1px solid color-mix(in srgb, var(--color-type-ENTRY_TYPE), transparent 70%);
```

### Spacing / Radius / Motion
```
Radius: sm=2px  md=6px  lg=12px  full=9999px
Motion: fast=120ms  base=200ms  easing=cubic-bezier(0.4,0,0.2,1)
Font:   system-ui (no download), ui-monospace for code
```

Dark mode: `.dark` class on `<html>`. Toggle via `useSettings` hook.

---

## File Structure

```
src/
├── main.tsx
├── App.tsx
├── index.css                    ← ALL design tokens here (@theme block)
│
├── components/
│   ├── layout/                  AppShell, Sidebar, BottomNav, TopBar
│   ├── onboarding/              SetupScreen (blocks app on first run)
│   ├── capture/                 CaptureModal, CaptureInput, TemplatePicker, ImagePreview, ClassificationBadge
│   ├── home/                    HomePage, TodayFeed, PendingTasksList, BlockerRiskList
│   ├── entries/                 EntryListPage, EntryCard, EntryDetail, EntryFilters, EntryTypeBadge
│   ├── decisions/               DecisionsPage
│   ├── chat/                    ChatPage, ChatMessageList, ChatMessage, ChatInput, SourceCitations
│   ├── settings/                SettingsPage, ProfileSection, ApiKeySection, ModelSelectorSection, DataSection
│   └── shared/                  Button, Badge, Modal, Spinner, Skeleton, EmptyState, ErrorBanner, MarkdownRenderer, NetworkIndicator, PriorityDot
│
├── hooks/
│   ├── useCapture.ts            skeleton → classify (async) → embed (queued)
│   ├── useEntries.ts            CRUD + filtering over IndexedDB
│   ├── useChat.ts               embed query → cosine rank → LLM stream
│   ├── useEmbedding.ts          worker queue
│   ├── useSettings.ts           localStorage r/w
│   ├── useDashboardStats.ts     useMemo aggregations (Phase 2)
│   ├── useNetworkStatus.ts      navigator.onLine + events
│   └── useKeyboardShortcut.ts
│
├── lib/
│   ├── db/                      schema.ts, entries.ts, migrations.ts
│   ├── llm/                     client.ts, classify.ts, chat.ts, prompts.ts
│   ├── embedding/               worker.ts, queue.ts
│   ├── search/                  cosine.ts
│   └── transfer/                jsonExport.ts, jsonImport.ts
│
├── data/
│   └── templates.ts             4 built-in capture templates
│
├── types/
│   └── index.ts                 all shared TypeScript interfaces
│
└── contexts/
    ├── SettingsContext.tsx
    └── EmbeddingContext.tsx
```

---

## Key Types (`src/types/index.ts`)

```ts
// NO enums — use const objects (erasableSyntaxOnly)
export const ENTRY_TYPES = ['work_log','decision','problem','solution',
  'meeting_note','task','learning','blocker','risk'] as const;
export type EntryType = typeof ENTRY_TYPES[number];

export const PRIORITIES = ['low','medium','high','critical'] as const;
export type Priority = typeof PRIORITIES[number];

export const SENTIMENTS = ['positive','neutral','negative','mixed'] as const;
export type Sentiment = typeof SENTIMENTS[number];

export interface JournalEntry {
  id: string;
  created_at: number;            // immutable
  timestamp: number;             // updated on edit
  raw_text: string;              // markdown supported
  images: EntryImage[];
  entry_type: EntryType;
  tags: string[];
  project: string | null;
  priority: Priority;
  sentiment: Sentiment;
  is_done: boolean;              // task completion toggle
  duration_minutes: number | null;  // Phase 2, work_log only
  starred: boolean;              // Phase 2
  embedding_vector: number[] | null;
}

export interface UserProfile {
  name: string;
  dayToDay: string;              // "What do you do day to day?" — free form
}
```

---

## Conventions

### Components
- Functional components only, no class components
- Props interface named `[ComponentName]Props` in the same file
- No default exports from `index.ts` barrel files — import directly from the file

### State
- No global store (no Zustand, Redux, etc.)
- `SettingsContext` and `EmbeddingContext` for cross-cutting concerns only
- Everything else: local `useState` or IDB

### CSS / Styling
- Tailwind utility classes only — no inline `style={{}}` except for dynamic values (e.g. graph node positions)
- Dark mode via `.dark` class — Tailwind `dark:` prefix works automatically
- Never hardcode color hex values in components — always use `var(--color-*)` or Tailwind tokens

### LLM Calls
- Always check `isOnline` before making LLM calls
- Classification failure → save entry with default values, never lose the raw text
- Always inject `userProfile.name` and `userProfile.dayToDay` into every system prompt
- Fetch existing projects + tags from IDB before each classification call

### Images
- Stored as base64 data URLs in `entry.images[]`
- Max 4 images per entry (soft limit enforced in CaptureInput)
- Always included in JSON export

---

## Phase Boundaries

### Phase 1 (build now)
Quick capture, LLM classification, entry management, home view (today feed + tasks + blockers), decisions log, conversational chat, settings, JSON export/import, PWA, offline handling.

### Phase 2 (later)
Calendar view, graph view (D3 force-directed), insights dashboard (charts, sentiment, time tracking), weekly review, keyword search, star/pin, linked references, activity streak.

**Do not build Phase 2 features during Phase 1 work.** `duration_minutes` and `starred` fields exist in the schema but their UI is Phase 2 only.

---

## Gotchas

- **COOP/COEP headers required** for `@xenova/transformers` WASM threads. Must be set in both Vite dev middleware and `vercel.json`.
- **`@xenova/transformers` must be excluded from Vite's `optimizeDeps`** — it handles its own bundling.
- **Web Worker uses `type: 'module'`** — set `worker: { format: 'es' }` in Vite config.
- **`dangerouslyAllowBrowser: true`** required for Anthropic SDK in browser — intentional, API key is user-supplied.
- **Tailwind v4 `@theme` tokens** become CSS custom properties AND Tailwind utilities automatically. Access as `bg-background`, `text-foreground`, etc.
- **React 19** — no need to import React in TSX files. JSX transform handles it.
- **pnpm** — use `pnpm add` not `npm install`. Workspace uses `pnpm-lock.yaml`.
