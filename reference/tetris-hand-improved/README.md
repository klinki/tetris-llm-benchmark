# Tetris

TetrisJS is browser based implementation of famous tetris game.
It follows the regular tetris brick shapes and allows to speed up brick placement by using down arrow or space key.

Tetris is well known game and now it has well defined rules: <https://tetris.fandom.com/wiki/Tetris_Guideline> - follow the rules!

## Visuals

- Each shape has different color

## Controls

Controls are:

- left/right - move to the sides
- up / x - rotate clockwise
- z / left ctrl - rotate anti clockwise
- down - slower drop down
- space - drop to position
- c - hold piece
- r - restart after game over
- p / escape - pause or resume (the game also pauses when the window loses focus)

Press **Enter** or click **Play** to start. On touch screens, use the on-screen
buttons; holding a direction repeats like a key. Sound is off by default; toggle
it with the ♪ button. Your best score is saved locally in your browser.

## Development

```sh
npm install     # installs TypeScript (dev-only, no runtime dependencies)
npm run build   # compiles src/ to dist/
npm start       # serves the game at http://localhost:8321
npm test        # builds and runs the engine, input and server tests
```

The game follows the Guideline: 7-bag randomizer, Super Rotation System
wall kicks, ghost piece, hold, next queue, lock delay, Guideline scoring
and gravity, and top-out on a blocked spawn.

The playfield has 10 columns, 20 visible rows, and a 20-row hidden buffer.
Pieces spawn in the hidden rows and drop into view at once. A grounded piece locks
after 500 ms; moves and rotations reset that delay up to 15 times, and reaching a
new lowest row restores the full delay and all resets. Soft drop is 20× gravity.
Scoring covers line clears, T-spins and minis (the fifth SRS kick promotes a mini),
back-to-back, combos, perfect clears, and 1/2 points per soft/hard-dropped row.
A hard drop that moves the piece cancels a pending T-spin. Every 10 lines raise
the level. The game ends on a blocked spawn or a lock wholly above the field.

### Project layout

- `src/pieces.ts` — tetromino shapes, colors, SRS kick tables, and the 7-bag randomizer
- `src/engine.ts` — board, movement, timing, lock delay, and scoring; no DOM dependencies.
  State is read-only from outside; `setUp()` loads a position for tests and tools
- `src/controls.ts` — key map and DAS/ARR auto-repeat, interleaved with the game clock; no DOM
- `src/renderer.ts` — sharp, aspect-correct Canvas drawing of the board and previews
- `src/main.ts` — browser wiring: keyboard/touch events, game loop, and interface
- `src/sound.ts`, `src/best-score.ts` — optional sound effects and the saved best score
- `scripts/serve.mjs` — dependency-free local server (`PORT` overrides 8321; `0` picks a free port)
- `tests/` — Node's built-in test runner: engine rules, input timing, the server, and a
  Chromium end-to-end suite. The browser suite needs Playwright, which is not a project
  dependency: it runs if `playwright` can be imported or `PLAYWRIGHT_MODULE` points to its
  package directory, and is skipped otherwise.

Requires Node.js 20+ and npm. The built game also runs on any static server that
serves this directory. It makes no external requests and works without network
access once loaded. Only TypeScript is installed for development.

Mechanics references: [Tetris Guideline](https://tetris.wiki/Tetris_Guideline),
[SRS rotation tables](https://tetris.wiki/Super_Rotation_System), and
[scoring](https://tetris.wiki/Scoring).

## Technologies

- Game should be implemented in browser, with TypeScript
- Make a dependency-free, well structured and performant code
- Keep the code simple and readable
