# Tetris

TetrisJS is a browser-based Tetris game written in TypeScript, with no runtime
dependencies. Make full horizontal lines, keep your stack below the top, and beat
your personal best.

## Play locally

Requires Node.js 20 or newer and npm.

```sh
npm install     # installs TypeScript (dev-only, no runtime dependencies)
npm run build   # compiles src/ to dist/
npm start       # builds and serves the game at http://localhost:8321
npm test        # builds and runs the headless game logic tests
```

Open **http://localhost:8321** and select **Let's play**, or press **Enter**.
The server listens on loopback only. Set `PORT` to use another port:

```sh
PORT=9000 npm start
```

After editing TypeScript, run `npm run build` and refresh the page. To deploy on
any static web host, build and serve `index.html`, `styles.css`, `favicon.svg`,
and the `dist/` directory together. The game needs no backend or external assets.

## Controls

| Key | Action |
| --- | --- |
| Left / right arrows | Move to the sides (hold to repeat) |
| Up arrow / X | Rotate clockwise |
| Z / left Ctrl | Rotate counterclockwise |
| Down arrow | Soft drop (hold to accelerate) |
| Space | Hard drop and lock immediately |
| C | Hold / swap piece, once per placement |
| P / Escape | Pause / resume |
| Enter | Start, resume, or play again |
| R | Restart after game over |

Touch controls appear on small screens and touch devices. Opening instructions,
switching tabs, or leaving the window automatically pauses an active game.
Resume explicitly when you return. Personal bests are saved on this device when
browser storage is available.

## Game rules

The implementation follows the core [Tetris Guideline](https://tetris.fandom.com/wiki/Tetris_Guideline)
mechanics, with an endless marathon progression:

- A 10 × 20 visible playfield with 20 hidden buffer rows.
- The seven standard shapes, each with its Guideline color: cyan I, blue J,
  orange L, yellow O, green S, purple T, and red Z.
- A shuffled seven-bag randomizer, five upcoming previews, a ghost piece, and hold.
- Super Rotation System (SRS), including separate I-piece wall/floor kicks.
- 500 ms lock delay, with up to 15 movement/rotation resets per piece.
- Tetris Worlds gravity; level increases every 10 cleared lines. Soft drop runs
  at 20 times gravity. Held horizontal movement uses 167 ms delay and 33 ms repeat.
- Top-out when a spawn is blocked (including hold) or a piece locks entirely above
  the visible field. Only R, Enter, or Play again starts a new game after top-out.

Scoring uses the level **before** the clear:

| Action | Base points × level |
| --- | ---: |
| Single / double / triple / Tetris | 100 / 300 / 500 / 800 |
| T-spin, zero / one / two / three lines | 400 / 800 / 1200 / 1600 |
| Mini T-spin, zero / one / two lines | 100 / 200 / 400 |
| Perfect clear, one / two / three / four lines | 800 / 1200 / 1800 / 2000 extra |

Back-to-back difficult clears (Tetrises or spin clears) multiply the action score
by 1.5. A back-to-back four-line perfect clear adds 3200 × level instead of 2000.
Consecutive line-clearing placements add 50 × combo count × level, starting at
zero for the first clear. A placement without lines resets the combo and
preserves the back-to-back chain; an ordinary single, double, or triple breaks
that chain. Soft drop earns 1 point per cell; hard drop earns 2 points per cell,
independent of level. T-spins use three-corner and pointing-side detection,
including the fifth-kick upgrade from mini to full.

Rule references: [Guideline overview](https://tetris.wiki/Tetris_Guideline),
[SRS kick tables](https://tetris.wiki/Super_Rotation_System), and
[Guideline scoring](https://tetris.wiki/Scoring).

## Project structure

- `src/game.ts` — game state, collision, gravity, locking, hold, and top-out.
- `src/pieces.ts` — shapes, colors, rotation data, and seven-bag randomizer.
- `src/scoring.ts` — clear scores, spins, combos, and bonuses.
- `src/input.ts` — keyboard and touch input with consistent movement repeat.
- `src/renderer.ts` — canvas playfield, ghost, previews, and brief clear effects.
- `src/main.ts` — game loop, accessible interface, pause, and saved personal best.
- `scripts/serve.mjs` — static development server using Node's standard library.
- `tests/game.test.mjs` — deterministic engine tests, including simulated games.

The engine is independent of the DOM and uses injectable randomness for repeatable
tests. Rendering updates when game state changes, respects reduced-motion
preferences, and scales canvases for the device's pixel density.
