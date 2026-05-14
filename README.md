# Recall

A privacy-first, single-user, local-first PWA work journal. Capture thoughts in under 5 seconds. LLM auto-classifies everything. Query your accumulated knowledge conversationally via semantic search.

**No backend. No auth. No cloud sync. All data stays in your browser.**

## How it works

```
Capture thought → LLM auto-tags it → stored in IndexedDB → query it via chat
```

Your journal entries are classified automatically using an OpenAI-compatible API. You bring your own API key — it never leaves your device.

## Features

- **Quick capture** — Cmd+K from anywhere. Text + images. 4 templates (Meeting, Decision, Blocker, Weekly Goal)
- **Auto-classification** — entry type, tags, project, priority, sentiment — all inferred by the LLM
- **Personalized** — tells the LLM your name and what you do day to day; every prompt is tailored to you
- **Conversational query** — ask questions about your journal, get cited answers
- **Today view** — pending tasks, open blockers, today's feed at a glance
- **Decisions log** — searchable, grouped by month
- **Offline first** — entries save immediately; classification retries when network restores
- **Dark / light / system** theme
- **JSON export + import** — your data, your terms

## Stack

| | |
|---|---|
| React 19 | UI |
| Vite 8 | Build |
| TypeScript 6 | Language |
| Tailwind CSS v4 | Styling (CSS-native config) |
| IndexedDB (`idb`) | Storage |
| OpenAI-compatible API | Classification + chat |
| `@xenova/transformers` | Local embeddings fallback |
| `lucide-react` | Icons |
| `react-router-dom` v7 | Routing |

## Getting started

**Prerequisites:** Node.js 20+, pnpm, an OpenAI-compatible API key (e.g. from OpenAI, OpenRouter, Groq, or Ollama)

```bash
git clone https://github.com/your-username/workgraph
cd workgraph
pnpm install
pnpm dev
```

Open http://localhost:5173, enter your name, describe your role, paste your API key — you're in.

## Commands

```bash
pnpm dev      # dev server at http://localhost:5173
pnpm build    # production build → dist/
pnpm preview  # preview production build
pnpm lint     # eslint
```

## Privacy

- API key stored in `localStorage` — never sent anywhere except directly to your configured API endpoint.
- All entries stored in IndexedDB in your browser
- No telemetry, no analytics, no accounts
- JSON export gives you a full portable copy of your data

## Contributing

PRs welcome. Please open an issue first for significant changes.

- Code style: Tailwind utility classes only (no inline styles except dynamic values), no `enum` (TypeScript 6 `erasableSyntaxOnly`), functional components only
- All design tokens live in `src/index.css` — no hardcoded color hex values in components

## License

MIT
