# Fluxwell

Fluxwell is a browser-based falling-block puzzle. Move and rotate pieces to fill rows in a 9×18 well. A dashed ghost piece shows where the current piece will land.

## Rules

- Each shuffled bag contains seven differently colored pieces, with shapes made from three, four, or five cells.
- The next three pieces are visible. You can hold or swap a piece once per placement.
- Rotation can shift a piece away from walls or the floor when space is available. A grounded piece locks after a short delay, and the game ends when a new piece cannot spawn.
- Full rows clear. Clearing several rows at once and clearing on consecutive placements earn bonuses. Gravity speeds up every eight cleared rows.

## Controls

- Left / right arrow — Move sideways
- Up arrow / X — Rotate clockwise
- Z / left Ctrl — Rotate counterclockwise
- Down arrow — Soft drop
- Space — Hard drop
- C — Hold or swap a piece
- R — Restart after game over
- Esc — Pause or resume

Use the on-screen controls on a touch device.

## Development

```sh
npm install     # installs TypeScript (dev-only, no runtime dependencies)
npm run build   # builds the game into dist/
npm start       # serves the game at http://localhost:8321
npm test        # builds and runs the headless logic smoke tests
```

`src/game.ts` contains the rules engine and `src/main.ts` connects it to the browser. The game runs locally with no runtime dependencies.
