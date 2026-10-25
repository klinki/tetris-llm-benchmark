# Tetris

TetrisJS is browser based implementation of famous tetris game.
It follows the regular tetris brick shapes and allows to speed up brick placement by using down arrow or space key.

Tetris is well known game and now it has well defined rules: <https://tetris.fandom.com/wiki/Tetris_Guideline> - follow the rules!

## Visuals

- Each shape has different color

## Controls 
Controls are:

- left/right - move to the sides
- up  / x - rotate clockwise
- z / left ctrl - rotate anti clockwise
- down - slower drop down
- space - drop to position
- c - hold piece
- r - restart after game over

## Development

```sh
npm install     # installs TypeScript (dev-only, no runtime dependencies)
npm run build   # compiles src/ to dist/
npm start       # serves the game at http://localhost:8321
npm test        # builds and runs the headless logic smoke tests
```

The game follows the Guideline: 7-bag randomizer, Super Rotation System
wall kicks, ghost piece, hold, next queue, lock delay, Guideline scoring
and gravity, and top-out on a blocked spawn.

## Technologies

- Game should be implemented in browser, with TypeScript
- Make a dependency-free, well structured and performant code
- Keep the code simple and readable

## Playing

Press **Enter** or click **Let’s play** to start. Press **P** or **Escape** to
pause/resume. Switching tabs or leaving the window pauses the game automatically.
The **How to play** button contains all keyboard shortcuts. Touch controls appear
on small screens and touch devices. Sound can be enabled in the header; your best
score is saved locally in your browser.

Marathon starts at level 1 and advances every 10 lines. Pieces use the standard
Guideline colors. The playfield has 10 × 20 visible cells plus 20 hidden rows,
five next-piece previews, a 500 ms lock delay, and at most 15 lock-delay resets.
Scoring includes T-spins and minis, combos, back-to-back clears, perfect clears,
and soft/hard drop points. There are no runtime dependencies, fonts, or external
assets to download.

## Project layout

- `src/engine.ts` — pure, headless game state, timing, and scoring
- `src/pieces.ts` — tetromino geometry, SRS kick tables, and 7-bag randomizer
- `src/input.ts` — keyboard/touch controls and consistent key repeat
- `src/renderer.ts` — high-DPI canvas rendering
- `src/main.ts` — game loop, interface, pause, and local best score
- `src/audio.ts` — optional synthesized sound effects
- `tests/engine.test.mjs` — headless engine and input tests
- `scripts/serve.mjs` — local HTTP server, with an automatic build on startup

After changing TypeScript, run `npm run build` and refresh the browser. Set `PORT`
to use a different local port. Serve the project root when using another static
server; `index.html` imports the compiled modules from `dist/`.
