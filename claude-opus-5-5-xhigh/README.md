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
- c / shift - hold piece
- p / esc - pause (also pauses automatically when the window loses focus)
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
