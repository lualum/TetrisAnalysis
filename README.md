# Tetris Analysis Project

Access Here: https://lualum.github.io/TetrisAnalysis/

A modern **Tetris gameplay analysis engine** inspired by chess engines and post-game chess analysis tools.

This project is not affiliated with, endorsed by, sponsored by, or presented as an official TETR.IO project. The current UI does emulate TETR.IO's interface in places, but this project is intended to be a separate analysis tool and should move away from TETR.IO's protected branding, artwork, wording, and distinctive UI presentation.

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
