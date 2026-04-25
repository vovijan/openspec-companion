# OpenSpec Companion

A local-first MVP for browsing and drafting OpenSpec changes in an existing project.

## What works now

- Select a local project folder in Chrome or Edge.
- Read `openspec/changes/*/{proposal.md,design.md,tasks.md}`.
- Browse changes and edit the active document.
- Generate an AI draft from a short idea.
- Choose what project context is sent to AI.
- Improve the current change with focused AI actions.
- Preview generated draft files before writing them.
- Apply or discard AI improvement patches before saving.
- Show a small diff summary for preview drafts.
- Save the current document back to the selected project.
- Archive active changes into `openspec/changes/archive/<date>-<change-id>`.
- Validate basic OpenSpec draft structure.
- Store recent projects in the browser for quick reopening.

The app uses the browser File System Access API for local project reads/writes. The OpenAI API key stays server-side.

## Configure AI

Copy `.env.example` to `.env` and set:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini
```

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Build

```bash
npm run build
```

## Next slices

- Add a full side-by-side markdown diff.
- Add stronger OpenSpec validation checks.
- Add persisted context presets per project.
- Wrap the app in Tauri after Rust/Cargo is installed.
