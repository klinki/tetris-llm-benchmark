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
- p / escape - pause or resume (the game also pauses when the tab loses focus)

Press **Enter** or click **Let’s play** to start. On small screens, use the
on-screen touch controls. Sound is optional; toggle it with the speaker button.
Your best score is saved locally in your browser.

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

The playfield has 10 columns, 20 visible rows, and a 20-row hidden buffer.
Pieces have a 500ms lock delay with up to 15 movement/rotation resets.
Scoring includes T-spins and minis, back-to-back clears, combos, perfect clears,
and drop points. Every 10 lines increases the level. Marathon play is endless.

### Project layout

- `src/engine.ts` — board, pieces, SRS kicks, timing, and scoring; no DOM dependencies
- `src/renderer.ts` — high-resolution Canvas rendering and piece previews
- `src/main.ts` — keyboard/touch input, game loop, interface, sound, and persistence
- `scripts/serve.mjs` — dependency-free local HTTP server (override port with `PORT`)
- `tests/engine.test.mjs` — headless logic tests using Node's built-in test runner

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
