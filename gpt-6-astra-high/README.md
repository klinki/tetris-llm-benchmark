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

Open `http://localhost:8321` after running `npm start`. Select **Let’s play**
or press Enter to begin. Press P or Escape to pause/resume; switching tabs
or leaving the window also pauses the game. Touch controls are available on
small screens and touch devices. Your personal best is saved locally when
browser storage is available.

The marathon advances one level per ten lines. The board has 10 columns,
20 visible rows, and 20 hidden rows. Pieces have a 500 ms lock delay with
up to 15 movement/rotation resets. Soft drop runs at 20 times gravity;
hard drop locks immediately. Scoring includes T-spins and mini T-spins,
combos, back-to-back difficult clears, and perfect clears. There is no
fixed finish level; gravity is capped at 20 cells per frame (60 Hz).

## Structure

- `src/pieces.ts`: tetromino geometry, SRS kick tables, and seven-bag randomizer.
- `src/game.ts`: browser-independent rules, timing, and scoring.
- `src/render.ts`: canvas playfield, ghost, and piece previews.
- `src/main.ts`: keyboard/touch input, UI, animation loop, and local best score.
- `scripts/serve.mjs`: local static server using Node’s built-in HTTP module.
- `tests/game.test.mjs`: headless rule tests using Node’s built-in test runner.

Use Node.js 20 or newer. Set `PORT` to change the development server port.
The built app can also be hosted statically: deploy `index.html`, `styles.css`,
and `dist/` together. No bundler, remote fonts, or runtime packages are needed.
