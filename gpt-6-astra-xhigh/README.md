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

Run `npm install` and `npm start`, then open <http://localhost:8321>.
Choose a starting level and click **Let's play** or press **Enter**. Use the
controls above; **P** or **Escape** pauses and resumes. The game automatically
pauses when the window loses focus. Touch screens also have on-screen controls.
The best score is saved locally when browser storage is available.

This is endless Marathon: levels advance at each ten-line threshold and speed
caps at level 15. The field has 10 columns, 20 visible rows and 20 hidden rows.
Pieces use a 500 ms lock delay with at most 15 move/rotation resets, a five-piece
preview queue, and 20× gravity for soft drop. Scoring includes T-spins and minis,
back-to-back difficult clears, combos, perfect clears, and drop distance. Both
blocked spawns and pieces locking entirely above the visible field end the game.

Rules references: [Guideline](https://tetris.wiki/Tetris_Guideline),
[SRS](https://tetris.wiki/Super_Rotation_System),
[scoring](https://tetris.wiki/Scoring), and
[Marathon gravity](https://tetris.wiki/Marathon).

## Structure

- `src/game.ts` — browser-independent board, timing, movement, hold and game state.
- `src/pieces.ts` — shapes, SRS kick tables, colors and seven-bag generator.
- `src/scoring.ts` — line-clear, spin, combo and perfect-clear scoring.
- `src/input.ts` — keyboard and pointer input with consistent key repeat.
- `src/renderer.ts` — high-DPI canvas rendering and piece previews.
- `src/main.ts` — game loop, interface and best-score persistence.
- `scripts/serve.mjs` — local static server using only Node's standard library.
- `tests/` — headless game-logic and server tests using Node's test runner.

TypeScript is the only development dependency; there are no runtime dependencies,
external fonts or asset requests. `npm start` builds before serving. Set `PORT`
to use a port other than 8321. The server binds to the local machine only.
For static hosting, deploy `index.html`, `styles.css`, and the built `dist/` folder.
