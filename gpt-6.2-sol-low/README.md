# Stack Shift

Stack Shift is a browser-based falling-block game with seven distinct shapes.
Complete horizontal rows to earn points and increase the falling speed.

## Visuals

- Each shape has different color

## Controls 
Controls are:

- left/right - move to the sides
- up  / x - rotate clockwise
- z / left ctrl - rotate anti clockwise
- down - soft drop
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

Stack Shift uses seven-piece bags, rotation kicks, a ghost piece, hold,
five previews, a 500 ms lock delay, drop and line-clear scoring, and
top-out on a blocked spawn.

## Technologies

- Game should be implemented in browser, with TypeScript
- Make a dependency-free, well structured and performant code
- Keep the code simple and readable
