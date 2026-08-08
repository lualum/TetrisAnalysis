# Tetris Analysis Project

Access Here: https://lualum.github.io/TetrisAnalysis/

A modern **Tetris gameplay analysis engine** inspired by chess engines and post-game chess analysis tools.

This project uses modern guideline Tetris mechanics — including **Super Rotation System (SRS)** and configurable **DAS/ARR handling**.
The app runs the real **Blockfish** engine in the browser through the bundled WASM package.

## Installation

```bash
git clone https://github.com/lualum/TetrisAnalysis
cd TetrisAnalysis
npm install
```

Use `npm run dev` to run.

## Blockfish in the Browser

Blockfish is bundled as WebAssembly generated from `../blockfish-dev/blockfish-wasm`.
Move analysis runs inside `src/blockfish-worker.ts`, so the app does not require a
separate native Blockfish process or a hosted analysis endpoint.

## Middleware Basics

The app-side middleware lives in `src/bot.ts`. It is the adapter between the playable
Tetris state and the Blockfish analysis engine.

At a high level:

1. `Bot` snapshots the current game into the JSON shape Blockfish expects:
   `hold`, `next`, `rows`, `placement_limit`, and `evaluation_placement_limit`.
2. `Bot` posts that JSON to `src/blockfish-worker.ts`.
3. The worker lazily initializes the bundled `blockfish-wasm` module, calls
   `analyze(snapshotJson)` or `evaluate_position(snapshotJson)`, and posts the result
   back to `Bot`.
4. `Bot` ignores stale responses by matching request ids and state keys, then applies or
   previews the returned input sequence.

The middleware boundary should stay data-oriented. Keep rendering, controls, and visual
state out of the analysis request path; the worker or remote endpoint should only need a
serializable game snapshot and should return analysis data.

## UI Independence Guardrails

This project must not mirror TETR.IO's UI. TETR.IO can be useful as a point of comparison
for gameplay concepts, but it should not be used as a visual template.

Design rules for future UI work:

- Do not copy TETR.IO layouts, menus, panels, typography, color treatments, animations,
  wording, icons, or interaction details.
- Keep CCAnalysis visually distinct: analysis-first, compact, utilitarian, and clearly
  branded as its own tool.
- Prefer original labels and control groupings that describe this app's analysis workflow
  instead of reproducing TETR.IO screen language.
- If a feature overlaps with common Tetris UX, implement only the generic function and
  choose independent styling.
- When in doubt, document the reason a UI choice is generic or original before merging it.
