# Tetris Analysis Project

Access Here: https://lualum.github.io/TetrisAnalysis/ 

A modern **Tetris gameplay analysis engine** inspired by chess engines and post-game chess analysis tools.

This project uses modern guideline Tetris mechanics — including **Super Rotation System (SRS)** and configurable **DAS/ARR handling**.
The local development server can bridge gameplay snapshots to the bundled **Blockfish** engine for move analysis.

## Installation

```bash
git clone https://github.com/lualum/TetrisAnalysis
cd TetrisAnalysis
npm install
```

Use `npm run dev` to run.

## Blockfish on GitHub Pages

The deployed app runs the real Blockfish engine in the browser through the WASM package
generated from `../blockfish-dev/blockfish-wasm`. Set `VITE_BLOCKFISH_ENDPOINT` at build
time only if you want to route suggestions to a hosted Blockfish-compatible endpoint
instead.
