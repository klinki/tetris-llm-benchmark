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
- p / esc - pause / resume
- r - restart game

## Development

```sh
npm install     # installs TypeScript (dev-only, zero runtime dependencies)
npm run build   # compiles TypeScript in src/ to dist/
npm test        # runs headless Guideline logic tests
npm start       # serves the game at http://localhost:8321
```

## Technologies

- Game should be implemented in browser, with TypeScript
- Make a dependency-free, well structured and performant code
- Keep the code simple and readable
