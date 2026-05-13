# WorkGraph — AI Operational Context

This repository is managed by Gemini CLI. This file contains foundational mandates, architecture rules, and conventions for the project.

## Architecture & Stack
- **Frontend:** React 19 (Functional components only, standard hooks).
- **Build/Routing:** Vite 8, React Router v7.
- **Language:** TypeScript 6 (`erasableSyntaxOnly` mode: no enums, no namespaces).
- **Styling:** Tailwind CSS v4. No CSS modules. Use utility classes exclusively. Design tokens live in `src/index.css`.
- **Storage:** Local-first IndexedDB via `idb` wrapper. DB: `workgraph` v3, Store: `entries` (keyPath: `id`). Schema defined in `src/lib/db/schema.ts`.
- **Icons:** `lucide-react` (Standard size: 18px-20px).

## Core Workflows
- **Markdown-First:** All text entries support Markdown. Displayed via `react-markdown`.
- **Quick Log:** Persistent capture bar on the Today page for high-velocity logging.
- **Outcome-Based Insights:** Tracking "Impact" (Priority) and "Time Spent" instead of sentiment.
- **Hybrid Search:** Combines semantic (vector) search with keyword scoring for robust retrieval.

## AI & ML Integration
- **Semantic Search (Embeddings):** 
  - **Primary/Default:** Runs 100% locally in the browser using `@xenova/transformers` (`Xenova/gte-small` model, producing 384-dimensional vectors).
  - **Fallback:** OpenAI-compatible embedding API.
- **Background Processing:** A `BackgroundProcessor` component in `AppShell.tsx` handles backfilling embeddings and retrying failed/pending classifications.
- **Classification:** Uses a generic OpenAI-compatible API to classify entries into consolidated types: `work_log`, `decision`, `issue`, `solution`, `meeting_note`, `task`, `learning`.
- **Diagnostics:** `src/lib/diagnostics.ts` provides tools for monitoring data integrity and AI processing status.

## Workflows & Commands
- **Package Manager:** `pnpm` (Workspace uses `pnpm-lock.yaml`).
- `pnpm dev` — Start development server.
- `pnpm build` — Production build.
- `pnpm lint` — Run ESLint.
- **Testing:** No formal test suite exists ("vibe coding" preferred by user). Do not add tests unless explicitly requested.

## Operational Constraints & Gotchas
- **COOP/COEP Headers:** Required for `@xenova/transformers` WASM threads. These are configured in both `vite.config.ts` (dev middleware) and `vercel.json` (production).
- **Bundling:** `@xenova/transformers` MUST be excluded from Vite's `optimizeDeps` array as it handles its own bundling.
- **Web Workers:** Must use `type: 'module'` (set `worker: { format: 'es' }` in Vite config).
- **Tailwind v4:** `@theme` tokens become CSS custom properties automatically.
- **React 19:** No need to import React in `.tsx` files; the JSX transform handles it.
