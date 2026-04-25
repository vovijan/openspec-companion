# OpenSpec Companion

A local-first MVP for browsing and drafting OpenSpec changes in an existing project.

OpenSpec Companion is a small developer tool for working with existing `openspec/` folders. It runs locally, reads and writes project files through the browser File System Access API, and keeps AI provider API keys on the local Node server.

## What works now

- Select a local project folder in Chrome or Edge.
- Read `openspec/changes/*/{proposal.md,design.md,tasks.md}`.
- Browse changes and edit the active document.
- Generate an AI draft from a short idea.
- Choose OpenAI, OpenRouter, or Anthropic for AI actions.
- Choose what project context is sent to AI.
- Improve the current change with focused AI actions.
- Preview generated draft files before writing them.
- Apply or discard AI improvement patches before saving.
- Review full markdown diffs for draft and AI patch previews.
- Apply AI patches per file.
- Save the current document back to the selected project.
- Archive active changes into `openspec/changes/archive/<date>-<change-id>`.
- Validate basic OpenSpec draft structure.
- Store recent projects in the browser for quick reopening.

The app uses the browser File System Access API for local project reads/writes. AI API keys stay server-side.

## Requirements

- Node.js 22 or newer.
- npm 10 or newer.
- Chrome or Edge for real local folder access.
- An OpenAI, OpenRouter, or Anthropic API key for AI draft and improve actions.

The app can run without provider API keys, but AI actions will fall back to local template patches.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/vovijan/openspec-companion.git
cd openspec-companion
npm install
```

## Configuration

Copy `.env.example` to `.env` and set:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-sonnet-4
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
PORT=5173
```

All model variables are optional. Defaults are:

- `OPENAI_MODEL=gpt-5.4-mini`
- `OPENROUTER_MODEL=anthropic/claude-sonnet-4`
- `ANTHROPIC_MODEL=claude-sonnet-4-20250514`

Only configure the providers you want to use. The selected provider is chosen in the app before running AI draft or improve actions.

## Development

```bash
npm run dev
```

Open `http://127.0.0.1:5173`.

The dev command starts one local Node server that serves both:

- the Vite React app;
- API routes such as `/api/generate-change` and `/api/improve-change`.

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run build
npm run preview
```

## How To Use

1. Open the app in Chrome or Edge.
2. Click `Select Project` and choose a repository that has, or should have, an `openspec/` folder.
3. Browse active changes in the left panel.
4. Edit `proposal.md`, `design.md`, or `tasks.md` in the center editor.
5. Use `Generate Draft` to create a new OpenSpec change from a short idea.
6. Review the diff preview, then click `Save Draft`.
7. Choose the AI provider in the `AI Draft` panel.
8. Use `AI Context` to choose what project context is sent to the model.
9. Use `AI Improve` actions to improve the current change, then apply or discard the patch.
10. Use `Save` to write the current document back to disk.
11. Use `Archive Change` to move a completed change into `openspec/changes/archive/<date>-<change-id>`.

## Notes

- Recent projects are stored in the browser with IndexedDB.
- Folder access depends on browser permissions. If permission expires, select the project folder again.
- The app does not upload project files except the context selected for AI requests.
- `.env` is ignored by git. Keep API keys out of commits.

## Next slices

- Add stronger OpenSpec validation checks.
- Add persisted context presets per project.
- Wrap the app in Tauri after Rust/Cargo is installed.
